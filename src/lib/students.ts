import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled } from './auth';
import { fetchGuardianByMobile, normalizeMobile } from './guardians';
import type { Student } from '../types';

const STUDENTS_COLLECTION = 'students';
const LOCAL_STORAGE_KEY = 'an-noor-students';

const DEFAULT_STUDENTS: Student[] = [
  {
    studentId: 'ANS-2024-001',
    name: 'Omar Ahmed',
    class: 'Grade 4',
    section: 'Sapphire',
    roll: '05',
    guardianName: 'Ahmedullah',
    guardianContact: '01712-XXXXXX',
    status: 'Active',
  },
  {
    studentId: 'ANS-2024-002',
    name: 'Sarah Khan',
    class: 'Grade 4',
    section: 'Sapphire',
    roll: '06',
    guardianName: 'Karim Khan',
    guardianContact: '01911-XXXXXX',
    status: 'Setup Needed',
  },
  {
    studentId: 'ANS-2024-003',
    name: 'Zaid Islam',
    class: 'Grade 2',
    section: 'Emerald',
    roll: '12',
    guardianName: 'Islam Uddin',
    guardianContact: '01844-XXXXXX',
    status: 'Active',
  },
];

function readLocalStudents(): Student[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_STUDENTS;
    const parsed = JSON.parse(raw) as Student[];
    return Array.isArray(parsed) ? parsed : DEFAULT_STUDENTS;
  } catch {
    return DEFAULT_STUDENTS;
  }
}

function writeLocalStudents(students: Student[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
}

function mergeStudents(existing: Student[], incoming: Student[]): Student[] {
  const map = new Map(existing.map((student) => [student.studentId, student]));

  incoming.forEach((student) => {
    const current = map.get(student.studentId);
    map.set(student.studentId, {
      ...current,
      ...student,
      status: current?.status === 'Active' ? 'Active' : student.status,
    });
  });

  return Array.from(map.values()).sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export async function fetchStudents(): Promise<Student[]> {
  if (isDemoLoginEnabled) {
    return readLocalStudents();
  }

  const snapshot = await getDocs(query(collection(db, STUDENTS_COLLECTION)));
  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs
    .map((document) => {
      const data = document.data();
      return {
        studentId: data.studentId ?? document.id,
        name: data.name ?? '',
        class: data.class ?? '',
        section: data.section,
        roll: data.roll,
        guardianName: data.guardianName,
        guardianContact: data.guardianContact ?? '',
        guardianEmail: data.guardianEmail,
        status: data.status ?? 'Setup Needed',
        admissionId: data.admissionId,
        inactiveReason: data.inactiveReason,
        photoUrl: data.photoUrl,
        idCardIssuedAt: data.idCardIssuedAt,
        academicYear: data.academicYear,
        dob: data.dob,
        gender: data.gender,
        fatherName: data.fatherName,
      } satisfies Student;
    })
    .sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export async function importStudents(students: Student[]): Promise<{ imported: number; updated: number }> {
  if (students.length === 0) {
    return { imported: 0, updated: 0 };
  }

  if (isDemoLoginEnabled) {
    const existing = readLocalStudents();
    const existingIds = new Set(existing.map((student) => student.studentId));
    const merged = mergeStudents(existing, students);
    writeLocalStudents(merged);

    const updated = students.filter((student) => existingIds.has(student.studentId)).length;
    return {
      imported: students.length - updated,
      updated,
    };
  }

  const existingSnapshot = await getDocs(query(collection(db, STUDENTS_COLLECTION)));
  const existingIds = new Set(existingSnapshot.docs.map((document) => document.id));

  const batch = writeBatch(db);
  let imported = 0;
  let updated = 0;

  students.forEach((student) => {
    const ref = doc(db, STUDENTS_COLLECTION, student.studentId);
    if (existingIds.has(student.studentId)) {
      updated += 1;
    } else {
      imported += 1;
    }

    batch.set(
      ref,
      {
        ...student,
        updatedAt: serverTimestamp(),
        ...(existingIds.has(student.studentId) ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true },
    );
  });

  await batch.commit();
  return { imported, updated };
}

export async function addStudent(student: Student): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocalStudents();
    writeLocalStudents(mergeStudents(existing, [student]));
    return;
  }

  const ref = doc(db, STUDENTS_COLLECTION, student.studentId);
  await setDoc(ref, { ...student, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
}

export async function updateStudentStatus(
  studentId: string,
  status: Student['status'],
  reason?: string,
): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocalStudents();
    const updated = existing.map((student) =>
      student.studentId === studentId ? { ...student, status, inactiveReason: reason } : student,
    );
    writeLocalStudents(updated);
    return;
  }

  const ref = doc(db, STUDENTS_COLLECTION, studentId);
  await updateDoc(ref, { status, inactiveReason: reason ?? null, updatedAt: serverTimestamp() });
}

export async function getNextStudentId(academicYear: string): Promise<string> {
  const students = await fetchStudents();
  const prefix = `ANS-${academicYear}-`;
  const maxSeq = students
    .map((student) => student.studentId)
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((num) => !Number.isNaN(num))
    .reduce((max, num) => Math.max(max, num), 0);

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function filterStudents(students: Student[], searchTerm: string): Student[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return students;

  return students.filter((student) =>
    [
      student.studentId,
      student.name,
      student.class,
      student.section,
      student.guardianContact,
      student.guardianName,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)),
  );
}

export async function fetchStudentById(studentId: string): Promise<Student | null> {
  const students = await fetchStudents();
  return students.find((student) => student.studentId === studentId) ?? null;
}

export async function fetchStudentsForGuardian(mobile: string): Promise<Student[]> {
  const guardian = await fetchGuardianByMobile(mobile);
  if (!guardian) {
    const normalized = normalizeMobile(mobile);
    const students = await fetchStudents();
    return students.filter((student) => normalizeMobile(student.guardianContact) === normalized);
  }

  const students = await fetchStudents();
  return students.filter((student) => guardian.studentIds.includes(student.studentId));
}
