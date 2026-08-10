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
import { isDemoLoginEnabled } from './auth';
import { addStudent, getNextStudentId, updateStudentStatus } from './students';
import { recordCollection, recordReversal } from './ledger';
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
  { department: 'teacher', label: 'Class Teacher / Coordinator' },
  { department: 'accounts', label: 'Accounts Department' },
  { department: 'principal', label: 'Principal' },
];

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

/* ---------------- Fee Structure ---------------- */

export async function fetchFeeStructure(): Promise<FeeStructure> {
  if (isDemoLoginEnabled) {
    return readLocal<FeeStructure>(LOCAL_FEE_STRUCTURES_KEY, DEFAULT_FEE_STRUCTURE);
  }

  const snapshot = await getDocs(query(collection(db, FEE_STRUCTURES_COLLECTION)));
  const defaultDoc = snapshot.docs.find((document) => document.id === 'default');
  return defaultDoc ? (defaultDoc.data() as FeeStructure) : DEFAULT_FEE_STRUCTURE;
}

export async function saveFeeStructure(items: FeeStructureItem[]): Promise<FeeStructure> {
  const structure: FeeStructure = {
    ...DEFAULT_FEE_STRUCTURE,
    items,
    updatedAt: new Date().toISOString(),
  };

  if (isDemoLoginEnabled) {
    writeLocal(LOCAL_FEE_STRUCTURES_KEY, structure);
    return structure;
  }

  await setDoc(doc(db, FEE_STRUCTURES_COLLECTION, 'default'), { ...structure, updatedAt: serverTimestamp() });
  return structure;
}

/* ---------------- Fee / Discount Calculation ---------------- */

export function computeTotals(feeItems: FeeStructureItem[], discounts: AdmissionDiscount[]) {
  const grossTotal = feeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalDiscount = discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const grandTotal = Math.max(0, grossTotal - totalDiscount);
  return { grossTotal, totalDiscount, grandTotal };
}

export function validateDiscount(
  itemKey: FeeItemKey,
  amount: number,
  feeItems: FeeStructureItem[],
): string | null {
  const item = feeItems.find((fee) => fee.key === itemKey);
  if (!item) return 'Unknown fee item.';
  if (!item.discountable) return 'Tuition Fee-এ discount দেওয়া যায় না।';
  if (amount < 0) return 'Discount amount negative হতে পারে না।';
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

  const snapshot = await getDocs(query(collection(db, ADMISSIONS_COLLECTION)));
  return snapshot.docs
    .map((document) => document.data() as Admission)
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
  guardianName: string;
  guardianContact: string;
  guardianEmail?: string;
  address?: string;
  academicYear: string;
  feeItems: FeeStructureItem[];
  discounts: AdmissionDiscount[];
  scannedFormUrl?: string;
  scannedFormName?: string;
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
    approvals: APPROVAL_FLOW.map((step) => ({
      department: step.department,
      label: step.label,
      status: 'pending',
    })),
    status: 'pending_approval',
    createdAt: now,
    updatedAt: now,
  };

  if (isDemoLoginEnabled) {
    const existing = readLocalAdmissions();
    writeLocalAdmissions([...existing, admission]);
    return admission;
  }

  await setDoc(doc(db, ADMISSIONS_COLLECTION, admission.id), { ...admission, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return admission;
}

async function persistAdmission(admission: Admission): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocalAdmissions();
    writeLocalAdmissions(existing.map((a) => (a.id === admission.id ? admission : a)));
    return;
  }

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

  if (params.department === 'accounts' && params.receivedInAccountId) {
    updated.receivedInAccountId = params.receivedInAccountId;
  }

  const allApproved = updatedApprovals.every((step) => step.status === 'approved');

  if (allApproved) {
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
    };

    await addStudent(student);

    if (updated.receivedInAccountId) {
      await recordCollection({
        accountId: updated.receivedInAccountId,
        amount: updated.grandTotal,
        reference: `Admission Fee Collection — ${admission.studentName} (${admission.formSerial})`,
        relatedId: admission.id,
      });
    }

    updated = { ...updated, status: 'approved', studentId };
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
