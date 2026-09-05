import { collection, doc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { getCurrentActorLabel } from './actor';
import { provisionLoginAccount } from './provisionAuth';
import { omitUndefined, toIsoString } from './utils';
import type {
  DutyAssignment,
  DutyKind,
  StaffDocument,
  StaffDocumentKind,
  StaffHireStatus,
  StaffMember,
  StaffTrack,
} from '../types';

const STAFF_COLLECTION = 'schoolStaff';
const LOCAL_STAFF_KEY = 'an-noor-school-staff';

export const TEACHER_CATEGORIES = [
  'Teacher',
  'Assistant Teacher',
  'Subject Teacher',
  'Head of Department',
] as const;

export const STAFF_CATEGORIES = [
  'Office Assistant',
  'Clerk',
  'Receptionist',
  'Librarian',
  'Lab Assistant',
  'Nurse',
  'Driver',
  'Transport Helper',
  'Security Guard',
  'Cleaner',
  'Aya',
  'Peon',
  'Cook',
  'Maintenance',
  'Electrician',
  'IT Support',
  'Accounts Assistant',
  'Other',
] as const;

export const ALL_STAFF_CATEGORIES = [...TEACHER_CATEGORIES, ...STAFF_CATEGORIES];

export const DUTY_OPTIONS: { id: DutyKind; label: string; needsClass?: boolean }[] = [
  { id: 'class_teacher', label: 'Class Teacher', needsClass: true },
  { id: 'subject_teacher', label: 'Subject Teacher', needsClass: true },
  { id: 'coordinator', label: 'Coordinator' },
  { id: 'exam_incharge', label: 'Exam In-charge' },
  { id: 'sports_incharge', label: 'Sports In-charge' },
  { id: 'cultural_incharge', label: 'Cultural In-charge' },
  { id: 'discipline_incharge', label: 'Discipline In-charge' },
  { id: 'library_incharge', label: 'Library In-charge' },
  { id: 'transport_incharge', label: 'Transport In-charge' },
  { id: 'office_duty', label: 'Office Duty' },
  { id: 'maintenance', label: 'Maintenance Duty' },
  { id: 'other', label: 'Other Duty' },
];

export function trackFromCategory(category: string): StaffTrack {
  return (TEACHER_CATEGORIES as readonly string[]).includes(category) ? 'teacher' : 'staff';
}

export function dutyLabel(kind: DutyKind): string {
  return DUTY_OPTIONS.find((item) => item.id === kind)?.label ?? kind;
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeDuty(raw: Partial<DutyAssignment>): DutyAssignment {
  return {
    id: raw.id || generateId('duty'),
    kind: raw.kind || 'other',
    title: raw.title || dutyLabel(raw.kind || 'other'),
    className: raw.className,
    section: raw.section,
    note: raw.note,
    status: raw.status || 'pending',
    requestedBy: raw.requestedBy || 'Accounts Department',
    requestedAt: toIsoString(raw.requestedAt),
    approvedBy: raw.approvedBy,
    approvedAt: raw.approvedAt ? toIsoString(raw.approvedAt) : undefined,
    reviewNote: raw.reviewNote,
  };
}

function normalizeStaff(raw: Partial<StaffMember>, fallbackId?: string): StaffMember {
  const category = raw.category || 'Other';
  return {
    id: raw.id || fallbackId || generateId('emp'),
    employeeId: raw.employeeId || raw.id || fallbackId || '',
    track: raw.track || trackFromCategory(category),
    category,
    designation: raw.designation || category,
    name: raw.name || '',
    email: raw.email,
    phone: raw.phone || '',
    gender: raw.gender,
    dob: raw.dob,
    nid: raw.nid,
    address: raw.address,
    fatherName: raw.fatherName,
    education: raw.education,
    experience: raw.experience,
    joiningDate: raw.joiningDate || new Date().toISOString().slice(0, 10),
    photoUrl: raw.photoUrl,
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    duties: Array.isArray(raw.duties) ? raw.duties.map((duty) => normalizeDuty(duty)) : [],
    status: raw.status || 'pending_approval',
    createdBy: raw.createdBy || 'Accounts Department',
    createdAt: toIsoString(raw.createdAt),
    reviewedBy: raw.reviewedBy,
    reviewedAt: raw.reviewedAt ? toIsoString(raw.reviewedAt) : undefined,
    reviewNote: raw.reviewNote,
  };
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  if (isDemoLoginEnabled) {
    return readLocal<StaffMember[]>(LOCAL_STAFF_KEY, [])
      .map((item) => normalizeStaff(item))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, STAFF_COLLECTION)));
  return snapshot.docs
    .map((document) => normalizeStaff(document.data() as StaffMember, document.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function fetchOnboardedStaff(track?: StaffTrack): Promise<StaffMember[]> {
  const people = await fetchStaffMembers();
  return people.filter((person) => person.status === 'active' && (!track || person.track === track));
}

export async function fetchPendingHires(): Promise<StaffMember[]> {
  const people = await fetchStaffMembers();
  return people.filter((person) => person.status === 'pending_approval');
}

export async function fetchPendingDuties(): Promise<{ person: StaffMember; duty: DutyAssignment }[]> {
  const people = await fetchStaffMembers();
  return people.flatMap((person) =>
    person.duties
      .filter((duty) => duty.status === 'pending')
      .map((duty) => ({ person, duty })),
  );
}

async function persistStaff(person: StaffMember): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocal<StaffMember[]>(LOCAL_STAFF_KEY, []);
    const index = existing.findIndex((item) => item.id === person.id);
    if (index >= 0) existing[index] = person;
    else existing.push(person);
    writeLocal(LOCAL_STAFF_KEY, existing);
    return;
  }

  await waitForAuthUser();
  await setDoc(doc(db, STAFF_COLLECTION, person.id), omitUndefined({
    ...person,
    updatedAt: serverTimestamp(),
  }), { merge: true });
}

async function nextEmployeeId(track: StaffTrack): Promise<string> {
  const people = await fetchStaffMembers();
  const prefix = track === 'teacher' ? 'ANIS-TCH-' : 'ANIS-STF-';
  const max = people
    .map((person) => person.employeeId)
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((num) => !Number.isNaN(num))
    .reduce((highest, num) => Math.max(highest, num), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export async function uploadStaffFile(
  file: File,
  folder: string,
  ownerId: string,
): Promise<{ url: string; name: string }> {
  if (isDemoLoginEnabled) {
    return { url: await fileToDataUrl(file), name: file.name };
  }

  await waitForAuthUser();
  const path = `staff-docs/${folder}/${ownerId}-${Date.now()}-${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return { url: await getDownloadURL(ref), name: file.name };
}

export interface CreateHireInput {
  category: string;
  designation?: string;
  name: string;
  email?: string;
  phone: string;
  gender?: string;
  dob?: string;
  nid?: string;
  address?: string;
  fatherName?: string;
  education?: string;
  experience?: string;
  joiningDate: string;
  photo?: File;
  documents?: { kind: StaffDocumentKind; file: File }[];
  loginPassword?: string;
}

export async function createStaffHire(input: CreateHireInput): Promise<StaffMember> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (!name) throw new Error('Name লিখুন।');
  if (!phone) throw new Error('Phone লিখুন।');
  if (!input.category) throw new Error('Staff category select করুন।');

  const track = trackFromCategory(input.category);
  const id = generateId('emp');
  const documents: StaffDocument[] = [];

  let photoUrl: string | undefined;
  if (input.photo) {
    const uploaded = await uploadStaffFile(input.photo, 'photos', id);
    photoUrl = uploaded.url;
  }

  for (const document of input.documents ?? []) {
    const uploaded = await uploadStaffFile(document.file, document.kind, id);
    documents.push({
      id: generateId('doc'),
      kind: document.kind,
      name: uploaded.name,
      url: uploaded.url,
    });
  }

  const person: StaffMember = {
    id,
    employeeId: await nextEmployeeId(track),
    track,
    category: input.category,
    designation: input.designation?.trim() || input.category,
    name,
    email: input.email?.trim().toLowerCase() || undefined,
    phone,
    gender: input.gender,
    dob: input.dob,
    nid: input.nid?.trim() || undefined,
    address: input.address?.trim() || undefined,
    fatherName: input.fatherName?.trim() || undefined,
    education: input.education?.trim() || undefined,
    experience: input.experience?.trim() || undefined,
    joiningDate: input.joiningDate,
    photoUrl,
    documents,
    duties: [],
    status: 'pending_approval',
    createdBy: getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
  };

  await persistStaff(person);
  return person;
}

export async function reviewStaffHire(params: {
  person: StaffMember;
  action: 'approved' | 'rejected';
  reviewedBy: string;
  note?: string;
  loginPassword?: string;
}): Promise<StaffMember> {
  if (params.person.status !== 'pending_approval') {
    throw new Error('This hire is not waiting for approval.');
  }

  const now = new Date().toISOString();
  const updated: StaffMember = {
    ...params.person,
    status: params.action === 'approved' ? 'active' : 'rejected',
    reviewedBy: params.reviewedBy,
    reviewedAt: now,
    reviewNote: params.note,
  };

  if (params.action === 'approved' && updated.email && updated.track === 'teacher') {
    try {
      const login = await provisionLoginAccount(updated.email, params.loginPassword);
      if (login.uid && !isDemoLoginEnabled) {
        await setDoc(doc(db, 'users', login.uid), {
          role: 'teacher',
          email: updated.email,
          name: updated.name,
          staffId: updated.id,
        }, { merge: true });
      }
    } catch {
      // Hire still succeeds if login already exists or Auth is unavailable.
    }
  }

  await persistStaff(updated);
  return updated;
}

export async function requestDutyAssignment(params: {
  person: StaffMember;
  kind: DutyKind;
  className?: string;
  section?: string;
  note?: string;
}): Promise<StaffMember> {
  const option = DUTY_OPTIONS.find((item) => item.id === params.kind);
  if (!option) throw new Error('Duty select করুন।');
  if (option.needsClass && !params.className) throw new Error('Class select করুন।');

  const titleParts = [option.label];
  if (params.className) titleParts.push(params.className);
  if (params.section) titleParts.push(params.section);

  const duty: DutyAssignment = {
    id: generateId('duty'),
    kind: params.kind,
    title: titleParts.join(' • '),
    className: params.className,
    section: params.section?.trim() || undefined,
    note: params.note?.trim() || undefined,
    status: 'pending',
    requestedBy: getCurrentActorLabel('Accounts Department'),
    requestedAt: new Date().toISOString(),
  };

  const updated: StaffMember = {
    ...params.person,
    duties: [...params.person.duties, duty],
  };
  await persistStaff(updated);
  return updated;
}

export async function assignDutyDirect(params: {
  person: StaffMember;
  kind: DutyKind;
  className?: string;
  section?: string;
  note?: string;
  actorName: string;
}): Promise<StaffMember> {
  const option = DUTY_OPTIONS.find((item) => item.id === params.kind);
  if (!option) throw new Error('Duty select করুন।');
  if (option.needsClass && !params.className) throw new Error('Class select করুন।');

  const titleParts = [option.label];
  if (params.className) titleParts.push(params.className);
  if (params.section) titleParts.push(params.section);
  const now = new Date().toISOString();

  const duty: DutyAssignment = {
    id: generateId('duty'),
    kind: params.kind,
    title: titleParts.join(' • '),
    className: params.className,
    section: params.section?.trim() || undefined,
    note: params.note?.trim() || undefined,
    status: 'active',
    requestedBy: params.actorName,
    requestedAt: now,
    approvedBy: params.actorName,
    approvedAt: now,
  };

  const updated: StaffMember = {
    ...params.person,
    duties: [...params.person.duties, duty],
  };
  await persistStaff(updated);
  return updated;
}

export async function reviewDutyAssignment(params: {
  person: StaffMember;
  dutyId: string;
  action: 'approved' | 'rejected';
  reviewedBy: string;
  note?: string;
}): Promise<StaffMember> {
  const duty = params.person.duties.find((item) => item.id === params.dutyId);
  if (!duty) throw new Error('Duty request পাওয়া যায়নি।');
  if (duty.status !== 'pending') throw new Error('This duty is not pending.');

  const now = new Date().toISOString();
  const updated: StaffMember = {
    ...params.person,
    duties: params.person.duties.map((item) =>
      item.id === params.dutyId
        ? {
            ...item,
            status: params.action === 'approved' ? 'active' : 'rejected',
            approvedBy: params.reviewedBy,
            approvedAt: now,
            reviewNote: params.note,
          }
        : item,
    ),
  };
  await persistStaff(updated);
  return updated;
}

export function activeDuties(person: StaffMember): DutyAssignment[] {
  return person.duties.filter((duty) => duty.status === 'active');
}

export function statusLabel(status: StaffHireStatus): string {
  if (status === 'pending_approval') return 'Pending Principal';
  if (status === 'active') return 'Onboarded';
  if (status === 'rejected') return 'Rejected';
  return 'Inactive';
}
