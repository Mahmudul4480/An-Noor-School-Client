export type UserRole = 'guardian' | 'teacher' | 'accounts' | 'principal' | 'super_admin';

export type StudentStatus = 'Active' | 'Setup Needed' | 'Inactive';

export interface Student {
  studentId: string;
  name: string;
  class: string;
  section?: string;
  roll?: string;
  guardianName?: string;
  guardianContact: string;
  guardianEmail?: string;
  status: StudentStatus;
  admissionId?: string;
  inactiveReason?: string;
}

export interface ParsedStudentRow {
  rowNumber: number;
  student: Student | null;
  errors: string[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  avatar?: string;
}

/* ---------------- Admission & Fee Structure ---------------- */

export type FeeItemKey =
  | 'admissionForm'
  | 'admissionFee'
  | 'digitalFee'
  | 'extraCurricularFee'
  | 'photocopyFee'
  | 'tuitionFee'
  | 'book'
  | 'copy'
  | 'stationery';

export interface FeeStructureItem {
  key: FeeItemKey;
  label: string;
  amount: number;
  /** Tuition Fee is not discountable per school policy; everything else can be. */
  discountable: boolean;
}

export interface FeeStructure {
  id: string;
  className: string;
  academicYear: string;
  items: FeeStructureItem[];
  updatedAt: string;
}

export interface AdmissionDiscount {
  itemKey: FeeItemKey;
  amount: number;
  reason: string;
}

export type ApprovalDepartment = 'teacher' | 'accounts' | 'principal';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalStep {
  department: ApprovalDepartment;
  label: string;
  status: ApprovalStatus;
  actionedBy?: string;
  note?: string;
  actionedAt?: string;
}

export type AdmissionStatus = 'pending_approval' | 'approved' | 'rejected' | 'cancelled';

export interface Admission {
  id: string;
  formSerial: string;
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
  grossTotal: number;
  totalDiscount: number;
  grandTotal: number;
  receivedInAccountId?: string;
  scannedFormUrl?: string;
  scannedFormName?: string;
  approvals: ApprovalStep[];
  status: AdmissionStatus;
  cancelReason?: string;
  studentId?: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------------- Expenses ---------------- */

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  accountId: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

/* ---------------- Bank / MFS Ledger ---------------- */

export type LedgerAccountType = 'cash' | 'bank' | 'mobile';

export interface LedgerAccount {
  id: string;
  name: string;
  type: LedgerAccountType;
  openingBalance: number;
  createdAt: string;
}

export type LedgerEntryType = 'debit' | 'credit';

export interface LedgerEntry {
  id: string;
  accountId: string;
  type: LedgerEntryType;
  amount: number;
  reference: string;
  relatedType?: 'admission' | 'expense' | 'transfer';
  relatedId?: string;
  date: string;
  note?: string;
  createdAt: string;
}

/* ---------------- Reports ---------------- */

export interface FinancialSummary {
  from: string;
  to: string;
  totalCollections: number;
  totalDiscountsGiven: number;
  totalExpenses: number;
  netCashFlow: number;
  accountBalances: { account: LedgerAccount; balance: number }[];
  admissionsInRange: Admission[];
  expensesInRange: Expense[];
}
