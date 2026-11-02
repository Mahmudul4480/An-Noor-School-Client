/**
 * Teacher attendance & curriculum.
 *  - attendance/{date}_{key}: one sheet per Dhaka date per class/section key (see teacherAccess keys).
 *  - curriculumTopics/{auto}: syllabus topic per class/section + subject with progress status.
 * Rules: teacher writes only own keys (teacherAccess), attendance only for Dhaka today; Principal/super admin read all.
 * Only roster fields (name, roll) are copied — never guardian info.
 */
import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { dhakaToday } from './utils';
import type { RosterEntry } from './teacherAccess';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'leave'];
export const ATTENDANCE_BN: Record<AttendanceStatus, string> = { present: 'উপস্থিত', absent: 'অনুপস্থিত', late: 'দেরি', leave: 'ছুটি' };

export interface AttendanceRecord { status: AttendanceStatus; name: string; roll: string }
export interface AttendanceSheet {
  id: string;
  date: string;
  className: string;
  section: string;
  key: string;
  records: Record<string, AttendanceRecord>;
  counts: Record<AttendanceStatus, number>;
  total: number;
  teacherEmail: string;
  teacherName: string;
  takenAt: string;
  updatedAtIso: string;
  updatedBy?: string;
  updatedByName?: string;
}

export type TopicStatus = 'planned' | 'ongoing' | 'done';
export const TOPIC_BN: Record<TopicStatus, string> = { planned: 'পরিকল্পিত', ongoing: 'চলমান', done: 'সম্পন্ন' };
export interface CurriculumTopic {
  id: string;
  className: string;
  section: string;
  key: string;
  subject: string;
  title: string;
  note?: string;
  status: TopicStatus;
  plannedDate?: string;
  startedDate?: string;
  doneDate?: string;
  teacherEmail: string;
  teacherName: string;
  updatedAtIso?: string;
}

export const SUBJECT_SUGGESTIONS = ['Bangla', 'English', 'Mathematics', 'Arabic', 'Quran', 'Islamic Studies', 'Science', 'Bangladesh & Global Studies', 'General Knowledge', 'Drawing', 'ICT'];

export function classKey(className: string, section?: string): string {
  const s = (section ?? '').trim();
  return s ? `S:${className}|${s}` : `C:${className}`;
}
export function attendanceDocId(date: string, key: string): string {
  return `${date}_${key.replace(/[^A-Za-z0-9]+/g, '-')}`;
}

async function myEmail(): Promise<string> {
  const u = await waitForAuthUser();
  return (u.email ?? '').trim().toLowerCase();
}

export function countStatuses(records: Record<string, AttendanceRecord>): Record<AttendanceStatus, number> {
  const c: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, leave: 0 };
  Object.values(records).forEach((r) => { if (c[r.status] !== undefined) c[r.status] += 1; });
  return c;
}

export async function fetchAttendanceSheet(date: string, key: string): Promise<AttendanceSheet | null> {
  if (isDemoLoginEnabled) return null;
  await waitForAuthUser();
  const snap = await getDoc(doc(db, 'attendance', attendanceDocId(date, key)));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as AttendanceSheet) : null;
}

/** History for one class/section key (rules allow the teacher only their own keys). */
export async function fetchAttendanceHistory(key: string): Promise<AttendanceSheet[]> {
  if (isDemoLoginEnabled) return [];
  await waitForAuthUser();
  const snap = await getDocs(query(collection(db, 'attendance'), where('key', '==', key)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceSheet)).sort((a, b) => b.date.localeCompare(a.date));
}

/** Principal / super admin: all sheets of a date. */
export async function fetchAttendanceForDate(date: string): Promise<AttendanceSheet[]> {
  if (isDemoLoginEnabled) return [];
  await waitForAuthUser();
  const snap = await getDocs(query(collection(db, 'attendance'), where('date', '==', date)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceSheet));
}

/** Thrown when the day's sheet changed on the server since the teacher loaded it (another teacher saved). */
export class AttendanceConflictError extends Error {
  constructor(public current: AttendanceSheet) { super('attendance-conflict'); }
}

/**
 * Transactional, per-student merge save.
 *  - Reads the current sheet inside a transaction.
 *  - If it changed since `existing` was loaded (or exists but wasn't loaded) and !force → AttendanceConflictError.
 *  - Only students whose status this teacher set/changed (vs. the loaded baseline) are overwritten; other
 *    students keep whatever is on the server, so two teachers never wipe each other's rows.
 *  - Writes studentAttendance/{date}_{studentId} projections for the guardian portal.
 */
export async function saveAttendance(args: {
  className: string; section: string; teacherName: string;
  students: RosterEntry[]; statuses: Record<string, AttendanceStatus>; existing: AttendanceSheet | null; force?: boolean;
}): Promise<AttendanceSheet> {
  const email = await myEmail();
  const date = dhakaToday();
  const key = classKey(args.className, args.section);
  const section = (args.section ?? '').trim();
  const id = attendanceDocId(date, key);
  const ref = doc(db, 'attendance', id);
  const baseline = (args.existing?.records ?? {}) as Record<string, AttendanceRecord>;
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? ({ id: snap.id, ...snap.data() } as AttendanceSheet) : null;
    if (current && !args.force && (!args.existing || current.updatedAtIso !== args.existing.updatedAtIso)) {
      throw new AttendanceConflictError(current);
    }
    const records: Record<string, AttendanceRecord> = { ...((current?.records ?? {}) as Record<string, AttendanceRecord>) };
    const touched: string[] = [];
    args.students.forEach((s) => {
      const st = args.statuses[s.studentId];
      if (!st) return;
      const mine = !args.existing || baseline[s.studentId]?.status !== st || !records[s.studentId];
      if (mine) { records[s.studentId] = { status: st, name: s.name || '', roll: s.roll || '' }; touched.push(s.studentId); }
    });
    const nowIso = new Date().toISOString();
    const name = args.teacherName || email;
    const data = {
      date, className: args.className, section, key, records,
      counts: countStatuses(records), total: Object.keys(records).length,
      teacherEmail: email, teacherName: name, updatedBy: email, updatedByName: name,
      takenAt: current?.takenAt ?? nowIso, updatedAtIso: nowIso, updatedAt: serverTimestamp(),
    };
    tx.set(ref, data);
    touched.forEach((sid) => {
      tx.set(doc(db, 'studentAttendance', `${date}_${sid}`), {
        studentId: sid, date, month: date.slice(0, 7), className: args.className, section, key,
        status: records[sid].status, teacherEmail: email, teacherName: name, updatedAtIso: nowIso, updatedAt: serverTimestamp(),
      });
    });
    return { id, ...data } as AttendanceSheet;
  });
}

export interface StudentAttendanceDay { id: string; studentId: string; date: string; month: string; status: AttendanceStatus; className: string; section: string; teacherName: string; updatedAtIso: string }

/** Guardian: one child's attendance days (rules allow only the guardian's linked studentIds). */
export async function fetchStudentAttendance(studentId: string): Promise<StudentAttendanceDay[]> {
  if (isDemoLoginEnabled || !studentId) return [];
  await waitForAuthUser();
  const snap = await getDocs(query(collection(db, 'studentAttendance'), where('studentId', '==', studentId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentAttendanceDay)).sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchTopicsForKeys(keys: string[]): Promise<CurriculumTopic[]> {
  if (isDemoLoginEnabled || !keys.length) return [];
  await waitForAuthUser();
  const res = await Promise.all(keys.map((k) => getDocs(query(collection(db, 'curriculumTopics'), where('key', '==', k)))));
  return res.flatMap((s) => s.docs.map((d) => ({ id: d.id, ...d.data() } as CurriculumTopic)));
}

export async function fetchAllTopics(): Promise<CurriculumTopic[]> {
  if (isDemoLoginEnabled) return [];
  await waitForAuthUser();
  const snap = await getDocs(collection(db, 'curriculumTopics'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CurriculumTopic));
}

export async function addTopic(t: { className: string; section: string; subject: string; title: string; note?: string; plannedDate?: string; teacherName: string }): Promise<void> {
  const email = await myEmail();
  const data: Record<string, unknown> = {
    className: t.className, section: (t.section ?? '').trim(), key: classKey(t.className, t.section),
    subject: t.subject.trim(), title: t.title.trim(), status: 'planned',
    teacherEmail: email, teacherName: t.teacherName || email,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedAtIso: new Date().toISOString(),
  };
  if (t.note?.trim()) data.note = t.note.trim();
  if (t.plannedDate) data.plannedDate = t.plannedDate;
  await addDoc(collection(db, 'curriculumTopics'), data);
}

export async function setTopicStatus(topic: CurriculumTopic, status: TopicStatus, teacherName: string): Promise<Partial<CurriculumTopic>> {
  const email = await myEmail();
  const today = dhakaToday();
  const patch: Record<string, unknown> = {
    status, teacherEmail: email, teacherName: teacherName || email,
    updatedAt: serverTimestamp(), updatedAtIso: new Date().toISOString(),
  };
  if (status === 'ongoing' && !topic.startedDate) patch.startedDate = today;
  if (status === 'done') { patch.doneDate = today; if (!topic.startedDate) patch.startedDate = today; }
  await updateDoc(doc(db, 'curriculumTopics', topic.id), patch);
  const { updatedAt: _u, ...rest } = patch;
  return rest as Partial<CurriculumTopic>;
}

export function progressPercent(topics: CurriculumTopic[]): number {
  if (!topics.length) return 0;
  return Math.round((topics.filter((t) => t.status === 'done').length / topics.length) * 100);
}

export function recordEntries(sheet: AttendanceSheet | null | undefined): Array<[string, AttendanceRecord]> {
  const r = (sheet?.records ?? {}) as Record<string, AttendanceRecord>;
  return Object.keys(r).map((k) => [k, r[k]] as [string, AttendanceRecord]);
}
