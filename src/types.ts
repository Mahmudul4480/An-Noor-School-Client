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
  photoUrl?: string;
  idCardIssuedAt?: string;
  academicYear?: string;
  dob?: string;
  gender?: string;
  fatherName?: string;
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
  grossTotal: number;
  totalDiscount: number;
  grandTotal: number;
  receivedInAccountId?: string;
  scannedFormUrl?: string;
  scannedFormName?: string;
  studentPhotoUrl?: string;
  receiptNumber?: string;
  paymentRecorded?: boolean;
  idCardIssued?: boolean;
  guardianLoginMobile?: string;
  guardianTempPassword?: string;
  approvals: ApprovalStep[];
  status: AdmissionStatus;
  cancelReason?: string;
  studentId?: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------------- Guardian Accounts ---------------- */

export interface GuardianAccount {
  id: string;
  mobile: string;
  authEmail: string;
  guardianName: string;
  studentIds: string[];
  createdAt: string;
}

/* ---------------- Categories (Principal Approval) ---------------- */

export type CategoryType = 'income' | 'expense';

export type CategoryRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CategoryRequest {
  id: string;
  type: CategoryType;
  name: string;
  requestedBy: string;
  status: CategoryRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
  createdAt: string;
}

/* ---------------- Income ---------------- */

export interface Income {
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

/* ---------------- Day Close ---------------- */

export interface DayCloseRecord {
  id: string;
  date: string;
  totalIncome: number;
  totalExpense: number;
  netCash: number;
  accountSnapshots: {
    accountId: string;
    accountName: string;
    accountType: LedgerAccountType;
    balance: number;
    todayIncome: number;
    todayExpense: number;
  }[];
  depositReminders: {
    accountId: string;
    accountName: string;
    cashInHand: number;
    suggestedDeposit: number;
    message: string;
  }[];
  closedBy: string;
  closedAt: string;
  note?: string;
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

export type LedgerAccountType = 'cash' | 'bank' | 'mobile' | 'online';

export interface LedgerAccount {
  id: string;
  name: string;
  type: LedgerAccountType;
  openingBalance: number;
  createdAt: string;
  /** System-managed accounts cannot be deleted from UI */
  systemManaged?: boolean;
}

export type LedgerEntryType = 'debit' | 'credit';

export interface LedgerEntry {
  id: string;
  accountId: string;
  type: LedgerEntryType;
  amount: number;
  reference: string;
  relatedType?: 'admission' | 'expense' | 'transfer' | 'invoice';
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

/* ---------------- Asset Registry ---------------- */

export interface AssetCategory {
  id: string;
  name: string;
  /** Short code used in asset numbers, e.g. IT, FURN */
  prefix: string;
  nextNumber: number;
  createdAt: string;
}

export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'disposed';

export interface SchoolAsset {
  id: string;
  assetNumber: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  purchaseValue: number;
  purchaseDate?: string;
  location?: string;
  usefulLifeYears?: number;
  condition: AssetCondition;
  serialNumber?: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------------- Invoicing & Online Payments ---------------- */

export type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export type InvoiceFeeType =
  | 'tuitionFee'
  | 'examFee'
  | 'busFee'
  | 'sportsFee'
  | 'utilityBill'
  | 'other';

export type PaymentMethod = 'cash' | 'bank' | 'mobile' | 'online' | 'gateway';

export type PaymentGatewayProvider = 'bkash' | 'nagad' | 'sslcommerz' | 'stripe' | 'manual';

export interface InvoiceLineItem {
  key: InvoiceFeeType;
  label: string;
  amount: number;
}

export interface StudentInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  section?: string;
  guardianContact: string;
  billingMonth: string;
  academicYear: string;
  lineItems: InvoiceLineItem[];
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  generatedAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  paymentAccountId?: string;
  gatewayRef?: string;
  gatewayProvider?: PaymentGatewayProvider;
  receiptNumber?: string;
  autoGenerated?: boolean;
}

export type PaymentIntentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface PaymentIntent {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  provider: PaymentGatewayProvider;
  status: PaymentIntentStatus;
  gatewaySessionId?: string;
  gatewayTransactionId?: string;
  redirectUrl?: string;
  createdAt: string;
  completedAt?: string;
}
