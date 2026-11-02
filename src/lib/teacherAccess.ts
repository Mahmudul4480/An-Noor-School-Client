/**
 * Teacher-scoped student access.
 *  - studentRoster/{studentId}: roster-only projection (no guardian phone, fees, reductions).
 *  - teacherAccess/{teacherEmail}: allowed keys derived from the teacher's ACTIVE class duties.
 *      'C:<class>'            -> whole class (duty without section)
 *      'S:<class>|<section>'  -> one section
 * Firestore rules let a teacher read only roster docs matching their keys; teachers cannot read `students`.
 */
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import type { StaffMember, Student } from '../types';

export const ROSTER_COLLECTION = 'studentRoster';
export const TEACHER_ACCESS_COLLECTION = 'teacherAccess';

export interface RosterEntry {
  studentId: string;
  name: string;
  class: string;
  section: string;
  roll: string;
  status: string;
}

export function rosterFromStudent(s: Student): RosterEntry {
  return {
    studentId: s.studentId,
    name: s.name || '',
    class: s.class || '',
    section: (s.section ?? '').trim(),
    roll: s.roll ?? '',
    status: s.status || 'Active',
  };
}

export function teacherAccessKeys(person: StaffMember): string[] {
  const keys = new Set<string>();
  person.duties
    .filter((d) => d.status === 'active' && d.className)
    .forEach((d) => {
      const section = (d.section ?? '').trim();
      keys.add(section ? `S:${d.className}|${section}` : `C:${d.className}`);
    });
  return [...keys].sort();
}

/** Best-effort mirror of one student into the roster (office roles). */
export async function upsertRosterEntries(students: Student[]): Promise<void> {
  if (isDemoLoginEnabled || !students.length) return;
  for (let i = 0; i < students.length; i += 400) {
    const batch = writeBatch(db);
    students.slice(i, i + 400).forEach((s) => {
      batch.set(doc(db, ROSTER_COLLECTION, s.studentId), { ...rosterFromStudent(s), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

export async function updateRosterStatus(studentId: string, status: string): Promise<void> {
  if (isDemoLoginEnabled) return;
  await setDoc(doc(db, ROSTER_COLLECTION, studentId), { studentId, status, updatedAt: serverTimestamp() }, { merge: true });
}

/** Writes teacherAccess for one staff member (Principal / super admin only by rules). */
export async function syncTeacherAccessFor(person: StaffMember): Promise<void> {
  if (isDemoLoginEnabled) return;
  const email = person.email?.trim().toLowerCase();
  if (!email) return;
  await waitForAuthUser();
  await setDoc(doc(db, TEACHER_ACCESS_COLLECTION, email), {
    staffId: person.id,
    name: person.name,
    keys: teacherAccessKeys(person),
    updatedAt: serverTimestamp(),
  });
}

/** Principal one-time / repair sync: rebuild roster for all students + access for all staff with email. */
export async function syncAllTeacherAccess(students: Student[], staff: StaffMember[]): Promise<{ students: number; teachers: number }> {
  await upsertRosterEntries(students);
  let teachers = 0;
  for (const person of staff) {
    if (!person.email?.trim()) continue;
    await syncTeacherAccessFor(person);
    teachers += 1;
  }
  return { students: students.length, teachers };
}

/** Teacher-side: query only allowed classes/sections (each query is provable by the rules). */
export async function fetchMyRoster(person: StaffMember): Promise<RosterEntry[]> {
  const keys = teacherAccessKeys(person);
  if (isDemoLoginEnabled || !keys.length) return [];
  await waitForAuthUser();
  const results = await Promise.all(keys.map(async (key) => {
    const col = collection(db, ROSTER_COLLECTION);
    const q = key.startsWith('C:')
      ? query(col, where('class', '==', key.slice(2)))
      : (() => { const [c, s] = key.slice(2).split('|'); return query(col, where('class', '==', c), where('section', '==', s)); })();
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RosterEntry);
  }));
  const map = new Map<string, RosterEntry>();
  results.flat().forEach((r) => map.set(r.studentId, r));
  return [...map.values()];
}
