import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { getCurrentActorLabel } from './actor';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { addStudent, getNextStudentId, updateStudentStatus } from './students';
import { recordCollection, recordReversal } from './ledger';
import { generateReceiptNumber } from './receipts';
import { omitUndefined } from './utils';
import { normalizeMobile, provisionGuardianLogin } from './guardians';
import type {
  Admission,
  AdmissionDiscount,
  ApprovalDepartment,
  ApprovalStep,
  FeeItemKey,
  FeeStructure,
  FeeStructureItem,
  Student,
} from '../types';

const ADMISSIONS_COLLECTION = 'admissions';
const FEE_STRUCTURES_COLLECTION = 'feeStructures';
const LOCAL_ADMISSIONS_KEY = 'an-noor-admissions';
const LOCAL_FEE_STRUCTURES_KEY = 'an-noor-fee-structures';

export const DEFAULT_FEE_ITEMS: FeeStructureItem[] = [
  { key: 'admissionForm', label: 'Admission Form', amount: 300, discountable: true },
  { key: 'admissionFee', label: 'Admission Fee', amount: 10000, discountable: true },
  { key: 'digitalFee', label: 'Digital Fee', amount: 1000, discountable: true },
  { key: 'extraCurricularFee', label: 'Extra Curricular Activity Fee', amount: 1000, discountable: true },
  { key: 'photocopyFee', label: 'Photocopy Fee', amount: 1000, discountable: true },
  { key: 'tuitionFee', label: 'Tuition Fee (Monthly)', amount: 4500, discountable: false },
  { key: 'book', label: 'Book (1 Year)', amount: 0, discountable: true },
  { key: 'copy', label: 'Copy (1 Year)', amount: 0, discountable: true },
  { key: 'stationery', label: 'Stationeries (1 Year)', amount: 0, discountable: true },
];

const DEFAULT_FEE_STRUCTURE: FeeStructure = {
  id: 'default',
  className: 'All Classes',
  academicYear: String(new Date().getFullYear()),
  items: DEFAULT_FEE_ITEMS,
  updatedAt: new Date().toISOString(),
};

export const APPROVAL_FLOW: { department: ApprovalDepartment; label: string }[] = [
  { department: 'principal', label: 'Principal' },
];

function normalizeApprovals(raw: ApprovalStep[] | undefined, status: Admission['status']): ApprovalStep[] {
  const steps = Array.isArray(raw) ? raw : [];
  const principal = steps.find((step) => step.department === 'principal');

  if (principal) {
    return [
      {
        department: 'principal',
        label: 'Principal',
        status: principal.status,
        actionedBy: principal.actionedBy,
        note: principal.note,
        actionedAt: principal.actionedAt,
      },
    ];
  }

  const rejected = steps.find((step) => step.status === 'rejected');
  if (rejected) {
    return [
      {
        department: 'principal',
        label: 'Principal',
        status: 'rejected',
        actionedBy: rejected.actionedBy,
        note: rejected.note,
        actionedAt: rejected.actionedAt,
      },
    ];
  }

  if (status === 'approved') {
    return [{ department: 'principal', label: 'Principal', status: 'approved' }];
  }

  return [{ department: 'principal', label: 'Principal', status: 'pending' }];
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

async function ensureFirebaseSession(): Promise<void> {
  if (!isDemoLoginEnabled) {
    await waitForAuthUser();
  }
}

function toIsoString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function defaultApprovals(): ApprovalStep[] {
  return APPROVAL_FLOW.map((step) => ({
    department: step.department,
    label: step.label,
    status: 'pending',
  }));
}

function normalizeAdmission(id: string, data: Record<string, unknown>): Admission | null {
  if (!data.studentName || !data.formSerial) {
    return null;
  }

  return {
    id: typeof data.id === 'string' ? data.id : id,
    formSerial: String(data.formSerial),
    studentName: String(data.studentName),
    fatherName: data.fatherName ? String(data.fatherName) : undefined,
    motherName: data.motherName ? String(data.motherName) : undefined,
    dob: data.dob ? String(data.dob) : undefined,
    gender: data.gender ? String(data.gender) : undefined,
    classApplied: String(data.classApplied ?? ''),
    section: data.section ? String(data.section) : undefined,
    birthRegNo: data.birthRegNo ? String(data.birthRegNo) : undefined,
    birthRegDocUrl: data.birthRegDocUrl ? String(data.birthRegDocUrl) : undefined,
    birthRegDocName: data.birthRegDocName ? String(data.birthRegDocName) : undefined,
    guardianName: String(data.guardianName ?? ''),
    guardianContact: String(data.guardianContact ?? ''),
    guardianEmail: data.guardianEmail ? String(data.guardianEmail) : undefined,
    address: data.address ? String(data.address) : undefined,
    academicYear: String(data.academicYear ?? new Date().getFullYear()),
    feeItems: Array.isArray(data.feeItems) ? (data.feeItems as FeeStructureItem[]) : DEFAULT_FEE_ITEMS,
    discounts: Array.isArray(data.discounts) ? (data.discounts as AdmissionDiscount[]) : [],
    grossTotal: Number(data.grossTotal) || 0,
    totalDiscount: Number(data.totalDiscount) || 0,
    grandTotal: Number(data.grandTotal) || 0,
    receivedInAccountId: data.receivedInAccountId ? String(data.receivedInAccountId) : undefined,
    scannedFormUrl: data.scannedFormUrl ? String(data.scannedFormUrl) : undefined,
    scannedFormName: data.scannedFormName ? String(data.scannedFormName) : undefined,
    studentPhotoUrl: data.studentPhotoUrl ? String(data.studentPhotoUrl) : undefined,
    receiptNumber: data.receiptNumber ? String(data.receiptNumber) : undefined,
    paymentRecorded: Boolean(data.paymentRecorded),
    idCardIssued: Boolean(data.idCardIssued),
    guardianLoginMobile: data.guardianLoginMobile ? String(data.guardianLoginMobile) : undefined,
    guardianTempPassword: data.guardianTempPassword ? String(data.guardianTempPassword) : undefined,
    approvals: normalizeApprovals(
      Array.isArray(data.approvals) ? (data.approvals as ApprovalStep[]) : undefined,
      (data.status as Admission['status']) || 'pending_approval',
    ),
    status: (data.status as Admission['status']) || 'pending_approval',
    cancelReason: data.cancelReason ? String(data.cancelReason) : undefined,
    studentId: data.studentId ? String(data.studentId) : undefined,
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

/* ---------------- Fee Structure ---------------- */

export function classStructureId(className: string): string {
  return className.trim().toLowerCase().replace(/\s+/g, '-');
}

export function cloneFeeItems(items: FeeStructureItem[] = DEFAULT_FEE_ITEMS): FeeStructureItem[] {
  return items.map((item) => ({ ...item }));
}

export function buildClassFeeStructure(className: string, items?: FeeStructureItem[]): FeeStructure {
  return {
    id: classStructureId(className),
    className,
    academicYear: String(new Date().getFullYear()),
    items: cloneFeeItems(items),
    updatedAt: new Date().toISOString(),
  };
}

export function tuitionFromItems(items: FeeStructureItem[]): number {
  return items.find((item) => item.key === 'tuitionFee')?.amount ?? 4500;
}

export function admissionFeeFromItems(items: FeeStructureItem[]): number {
  return items.find((item) => item.key === 'admissionFee')?.amount ?? 0;
}

function isFeeStructureRecord(value: unknown): value is FeeStructure {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as FeeStructure).items));
}

function readLocalFeeMap(): Record<string, FeeStructure> {
  try {
    const raw = localStorage.getItem(LOCAL_FEE_STRUCTURES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (isFeeStructureRecord(parsed)) {
      const id = parsed.id && parsed.id !== 'default' ? parsed.id : 'default';
      return { [id]: parsed };
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, FeeStructure>;
    }
  } catch {
    /* ignore corrupt local cache */
  }
  return {};
}

function writeLocalFeeMap(map: Record<string, FeeStructure>) {
  writeLocal(LOCAL_FEE_STRUCTURES_KEY, map);
}

function normalizeFeeStructure(data: Partial<FeeStructure>, fallbackClass: string): FeeStructure {
  const className = data.className || fallbackClass;
  return {
    id: data.id || classStructureId(className),
    className,
    academicYear: data.academicYear || String(new Date().getFullYear()),
    items: Array.isArray(data.items) && data.items.length > 0 ? data.items : cloneFeeItems(),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export async function fetchAllFeeStructures(): Promise<FeeStructure[]> {
  if (isDemoLoginEnabled) {
    return Object.values(readLocalFeeMap()).map((structure) =>
      normalizeFeeStructure(structure, structure.className || 'All Classes'),
    );
  }

  await ensureFirebaseSession();
  const snapshot = await getDocs(query(collection(db, FEE_STRUCTURES_COLLECTION)));
  return snapshot.docs.map((document) =>
    normalizeFeeStructure({ ...(document.data() as FeeStructure), id: document.id }, document.id),
  );
}

export function resolveClassFeeItems(structures: FeeStructure[], className: string): FeeStructureItem[] {
  const id = classStructureId(className);
  const match = structures.find((structure) => structure.id === id || structure.className === className);
  if (match) return cloneFeeItems(match.items);
  const fallback = structures.find((structure) => structure.id === 'default');
  return cloneFeeItems(fallback?.items);
}

export async function fetchFeeStructure(className?: string): Promise<FeeStructure> {
  const all = await fetchAllFeeStructures();
  if (!className) {
    const fallback = all.find((structure) => structure.id === 'default') ?? DEFAULT_FEE_STRUCTURE;
    return normalizeFeeStructure(fallback, 'All Classes');
  }

  const existing = all.find(
    (structure) => structure.id === classStructureId(className) || structure.className === className,
  );
  return existing
    ? normalizeFeeStructure(existing, className)
    : buildClassFeeStructure(className, resolveClassFeeItems(all, className));
}

export async function saveFeeStructure(className: string, items: FeeStructureItem[]): Promise<FeeStructure> {
  const structure = buildClassFeeStructure(className, items);

  if (isDemoLoginEnabled) {
    const map = readLocalFeeMap();
    map[structure.id] = structure;
    writeLocalFeeMap(map);
    return structure;
  }

  await ensureFirebaseSession();
  await setDoc(
    doc(db, FEE_STRUCTURES_COLLECTION, structure.id),
    omitUndefined({ ...structure, updatedAt: serverTimestamp() } as Record<string, unknown>),
  );
  return structure;
}

/* ---------------- Fee / Discount Calculation ---------------- */

export function computeTotals(feeItems: FeeStructureItem[], discounts: AdmissionDiscount[]) {
  const grossTotal = feeItems.reduce((sum, item) => sum + item.amount, 0);

  // Overall concession applied after gross total
  const overallDiscount = discounts.filter((d) => d.itemKey === 'overall').reduce((sum, d) => sum + d.amount, 0);
  // Legacy per-item discounts
  const perItemDiscount = discounts
    .filter((d) => d.itemKey !== 'overall')
    .reduce((sum, discount) => sum + discount.amount, 0);

  const totalDiscount = overallDiscount + perItemDiscount;
  const grandTotal = Math.max(0, grossTotal - totalDiscount);
  return { grossTotal, totalDiscount, grandTotal };
}

export function maxDiscountableAmount(feeItems: FeeStructureItem[]): number {
  return feeItems.filter((item) => item.discountable).reduce((sum, item) => sum + item.amount, 0);
}

export function validateDiscount(
  itemKey: FeeItemKey | 'overall',
  amount: number,
  feeItems: FeeStructureItem[],
): string | null {
  if (amount < 0) return 'Discount amount negative হতে পারে না।';

  if (itemKey === 'overall') {
    const max = maxDiscountableAmount(feeItems);
    if (amount > max) {
      return `Concession ৳ ${max.toLocaleString('en-BD')} পর্যন্ত দেওয়া যাবে (Tuition Fee বাদে)।`;
    }
    return null;
  }

  const item = feeItems.find((fee) => fee.key === itemKey);
  if (!item) return 'Unknown fee item.';
  if (!item.discountable) return 'Tuition Fee-এ discount দেওয়া যায় না।';
  if (amount > item.amount) return 'Discount amount fee-এর চেয়ে বেশি হতে পারে না।';
  return null;
}

/* ---------------- Form serial ---------------- */

export async function getNextFormSerial(academicYear: string): Promise<string> {
  const admissions = await fetchAdmissions();
  const prefix = `FORM-${academicYear}-`;
  const maxSeq = admissions
    .map((a) => a.formSerial)
    .filter((serial) => serial.startsWith(prefix))
    .map((serial) => parseInt(serial.slice(prefix.length), 10))
    .filter((num) => !Number.isNaN(num))
    .reduce((max, num) => Math.max(max, num), 0);

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

/* ---------------- Scanned form upload ---------------- */

export async function uploadStudentPhoto(file: File, admissionId: string): Promise<string> {
  if (isDemoLoginEnabled) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const path = `student-photos/${admissionId}-${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return getDownloadURL(ref);
}

export async function uploadScannedForm(file: File, formSerial: string): Promise<{ url: string; name: string }> {
  if (isDemoLoginEnabled) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, name: file.name };
  }

  const path = `admission-forms/${formSerial}-${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return { url, name: file.name };
}

export async function uploadBirthRegDocument(file: File, formSerial: string): Promise<{ url: string; name: string }> {
  if (isDemoLoginEnabled) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, name: file.name };
  }

  const path = `birth-reg-docs/${formSerial}-${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return { url, name: file.name };
}

/* ---------------- Admissions CRUD ---------------- */

function readLocalAdmissions(): Admission[] {
  return readLocal<Admission[]>(LOCAL_ADMISSIONS_KEY, []);
}

function writeLocalAdmissions(admissions: Admission[]) {
  writeLocal(LOCAL_ADMISSIONS_KEY, admissions);
}

export async function fetchAdmissions(): Promise<Admission[]> {
  if (isDemoLoginEnabled) {
    return readLocalAdmissions().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  await ensureFirebaseSession();
  const snapshot = await getDocs(query(collection(db, ADMISSIONS_COLLECTION)));
  return snapshot.docs
    .map((document) => normalizeAdmission(document.id, document.data() as Record<string, unknown>))
    .filter((admission): admission is Admission => admission !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface CreateAdmissionInput {
  studentName: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  gender?: string;
  classApplied: string;
  section?: string;
  birthRegNo?: string;
  birthRegDocUrl?: string;
  birthRegDocName?: string;
  guardianName: string;
  guardianContact: string;
  guardianEmail?: string;
  address?: string;
  academicYear: string;
  feeItems: FeeStructureItem[];
  discounts: AdmissionDiscount[];
  scannedFormUrl?: string;
  scannedFormName?: string;
  studentPhotoUrl?: string;
  receivedInAccountId: string;
}

export async function createAdmission(input: CreateAdmissionInput): Promise<Admission> {
  const formSerial = await getNextFormSerial(input.academicYear);
  const { grossTotal, totalDiscount, grandTotal } = computeTotals(input.feeItems, input.discounts);
  const now = new Date().toISOString();

  const admission: Admission = {
    id: generateId('adm'),
    formSerial,
    studentName: input.studentName,
    fatherName: input.fatherName,
    motherName: input.motherName,
    dob: input.dob,
    gender: input.gender,
    classApplied: input.classApplied,
    section: input.section,
    birthRegNo: input.birthRegNo,
    birthRegDocUrl: input.birthRegDocUrl,
    birthRegDocName: input.birthRegDocName,
    guardianName: input.guardianName,
    guardianContact: input.guardianContact,
    guardianEmail: input.guardianEmail,
    address: input.address,
    academicYear: input.academicYear,
    feeItems: input.feeItems,
    discounts: input.discounts,
    grossTotal,
    totalDiscount,
    grandTotal,
    scannedFormUrl: input.scannedFormUrl,
    scannedFormName: input.scannedFormName,
    studentPhotoUrl: input.studentPhotoUrl,
    receivedInAccountId: input.receivedInAccountId,
    receiptNumber: generateReceiptNumber(),
    paymentRecorded: false,
    idCardIssued: false,
    guardianLoginMobile: normalizeMobile(input.guardianContact),
    approvals: APPROVAL_FLOW.map((step) => ({
      department: step.department,
      label: step.label,
      status: 'pending',
    })),
    status: 'pending_approval',
    createdBy: getCurrentActorLabel('Accounts Department'),
    createdAt: now,
    updatedAt: now,
  };

  if (isDemoLoginEnabled) {
    const existing = readLocalAdmissions();
    writeLocalAdmissions([...existing, admission]);
    return admission;
  }

  await ensureFirebaseSession();
  await setDoc(doc(db, ADMISSIONS_COLLECTION, admission.id), { ...admission, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return admission;
}

async function persistAdmission(admission: Admission): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocalAdmissions();
    writeLocalAdmissions(existing.map((a) => (a.id === admission.id ? admission : a)));
    return;
  }

  await ensureFirebaseSession();
  await updateDoc(doc(db, ADMISSIONS_COLLECTION, admission.id), {
    ...admission,
    updatedAt: serverTimestamp(),
  });
}

export async function actOnApproval(params: {
  admission: Admission;
  department: ApprovalDepartment;
  action: 'approved' | 'rejected';
  actorName: string;
  note?: string;
  receivedInAccountId?: string;
}): Promise<Admission> {
  const { admission } = params;

  const updatedApprovals: ApprovalStep[] = admission.approvals.map((step) =>
    step.department === params.department
      ? {
          ...step,
          status: params.action,
          actionedBy: params.actorName,
          note: params.note,
          actionedAt: new Date().toISOString(),
        }
      : step,
  );

  let updated: Admission = {
    ...admission,
    approvals: updatedApprovals,
    updatedAt: new Date().toISOString(),
  };

  if (params.action === 'rejected') {
    updated.status = 'rejected';
    await persistAdmission(updated);
    return updated;
  }

  const allApproved = updatedApprovals.every((step) => step.status === 'approved');

  if (allApproved) {
    if (updated.receivedInAccountId && updated.grandTotal > 0 && !updated.paymentRecorded) {
      await recordCollection({
        accountId: updated.receivedInAccountId,
        amount: updated.grandTotal,
        reference: `Admission Fee — ${updated.studentName} (${updated.formSerial})`,
        relatedId: updated.id,
        date: new Date().toISOString().slice(0, 10),
      });
      updated.paymentRecorded = true;
    }

    const studentId = await getNextStudentId(admission.academicYear);
    const student: Student = {
      studentId,
      name: admission.studentName,
      class: admission.classApplied,
      section: admission.section,
      guardianName: admission.guardianName,
      guardianContact: admission.guardianContact,
      guardianEmail: admission.guardianEmail,
      status: 'Active',
      admissionId: admission.id,
      photoUrl: admission.studentPhotoUrl,
      academicYear: admission.academicYear,
      dob: admission.dob,
      gender: admission.gender,
      fatherName: admission.fatherName,
      idCardIssuedAt: new Date().toISOString(),
    };

    await addStudent(student);

    const guardianLogin = await provisionGuardianLogin({
      mobile: admission.guardianContact,
      guardianName: admission.guardianName,
      studentId,
    });

    updated = {
      ...updated,
      status: 'approved',
      studentId,
      idCardIssued: true,
      guardianLoginMobile: guardianLogin.mobile,
      guardianTempPassword: guardianLogin.password,
    };
  }

  await persistAdmission(updated);
  return updated;
}

export async function cancelAdmission(admission: Admission, reason: string, actorName: string): Promise<Admission> {
  const updated: Admission = {
    ...admission,
    status: 'cancelled',
    cancelReason: reason,
    updatedAt: new Date().toISOString(),
  };

  if (admission.studentId) {
    await updateStudentStatus(admission.studentId, 'Inactive', `Admission cancelled: ${reason}`);
  }

  if (admission.status === 'approved' && admission.receivedInAccountId) {
    await recordReversal({
      accountId: admission.receivedInAccountId,
      amount: admission.grandTotal,
      reference: `Admission Cancelled — Refund/Reversal (${admission.formSerial})`,
      relatedId: admission.id,
      note: `Cancelled by ${actorName}: ${reason}`,
    });
  }

  await persistAdmission(updated);
  return updated;
}
