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
  /** `overall` = concession after gross total; otherwise a legacy per-item discount */
  itemKey: FeeItemKey | 'overall';
  amount: number;
  reason: string;
}

export type ApprovalDepartment = 'accounts' | 'principal';

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
  createdBy?: string;
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
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  /** Payment voucher number, issued once the Principal approves the expense */
  voucherNumber?: string;
}

/* ---------------- Manual Income ---------------- */

/** Any money coming in outside admissions and student invoices — donation, rent, tender, etc. */
export interface IncomeEntry {
  id: string;
  receiptNumber: string;
  date: string;
  category: string;
  /** Who the money came from */
  source: string;
  description: string;
  amount: number;
  accountId: string;
  paymentMethod?: 'cash' | 'bank' | 'mobile';
  /** Deposit slip / transaction number for bank & mobile receipts */
  reference?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

/* ---------------- Inventory / Store ---------------- */

export type InventoryPurpose = 'student' | 'school';

/** A consumable the school stocks — student shop items or school-use store items. */
export interface InventoryItem {
  id: string;
  name: string;
  /** Student shop vs school-use store — keeps accounts and physical shelves separate */
  purpose?: InventoryPurpose;
  /** Which class the item is meant for; 'All' when it is not class specific */
  className: string;
  unit: string;
  /** Purchase rate — also the price staff pay */
  costRate: number;
  /** Selling price for students, normally a little above cost */
  studentPrice: number;
  purchasedQty: number;
  soldQty: number;
  /** Reorder level; at or below this a purchase alert is raised */
  lowStockThreshold: number;
  note?: string;
  archived?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type InventoryBuyerType = 'student' | 'staff';

export type InventoryMovementType = 'purchase' | 'sale' | 'issue' | 'adjustment';

/** One purchased batch. Sales consume the oldest remaining lot first (FIFO). */
export interface InventoryLot {
  id: string;
  itemId: string;
  itemName: string;
  receivedDate: string;
  quantity: number;
  remainingQty: number;
  unitCost: number;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export interface InventoryFifoSlice {
  lotId: string;
  lotDate: string;
  quantity: number;
  unitCost: number;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: InventoryMovementType;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  buyerType?: InventoryBuyerType;
  buyerName?: string;
  studentId?: string;
  className?: string;
  accountId?: string;
  date: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
  /** Lots this sale/write-off consumed, oldest first */
  fifoSlices?: InventoryFifoSlice[];
}

export interface InventoryStockAlert {
  item: InventoryItem;
  remaining: number;
  shortBy: number;
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
  /** Petty cash can go below zero when someone pays out of pocket */
  allowsOverdraft?: boolean;
}

export type LedgerEntryType = 'debit' | 'credit';

export interface LedgerEntry {
  id: string;
  accountId: string;
  type: LedgerEntryType;
  amount: number;
  reference: string;
  relatedType?: 'admission' | 'expense' | 'transfer' | 'invoice' | 'reversal' | 'income' | 'inventory';
  relatedId?: string;
  date: string;
  note?: string;
  createdAt: string;
  reversed?: boolean;
  reversalOfEntryId?: string;
}

export interface ReverseRequest {
  id: string;
  entryId: string;
  accountId: string;
  accountName?: string;
  reference: string;
  entryType: LedgerEntryType;
  amount: number;
  reason: string;
  requestedBy: string;
  createdAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface StudentCorrectionLog {
  id: string;
  studentId: string;
  field: string;
  oldValue: string;
  newValue: string;
  correctedBy: string;
  correctedAt: string;
  reason?: string;
}

/* ---------------- Reports ---------------- */

export interface FinancialSummary {
  from: string;
  to: string;
  reportLabel: string;
  totalCollections: number;
  admissionCollections: number;
  feeCollections: number;
  totalDiscountsGiven: number;
  totalExpenses: number;
  netCashFlow: number;
  accountBalances: { account: LedgerAccount; balance: number }[];
  admissionsInRange: Admission[];
  invoicesInRange: StudentInvoice[];
  expensesInRange: Expense[];
}

export interface FinancialOverview {
  netLiquidity: number;
  monthlyExpense: number;
  uncollectedDues: number;
  assetValue: number;
  monthlyFlow: { name: string; revenue: number; expense: number }[];
  accountBalances: { account: LedgerAccount; balance: number }[];
}

export interface DirectorClassRow {
  className: string;
  displayName: string;
  totalStudents: number;
  newStudents: number;
  classShifted: string;
  leftStudents: number;
  tuitionCollected: number;
  tuitionDues: number;
  examCollected: number;
  examDues: number;
  previousDuesNote: string;
  isHifz: boolean;
}

export interface DirectorMoneyRow {
  sl: string;
  voucherNo: string;
  label: string;
  folio: string;
  cash: number;
  bank: number;
  total: number;
  isEmpty: boolean;
}

export interface DirectorMoneyTotals {
  cash: number;
  bank: number;
  total: number;
}

export interface DirectorBankLine {
  name: string;
  balance: number;
}

/** Instant director-meeting pack: class collection sheet + income/expense sheet. */
export interface DirectorBriefing {
  generatedAt: string;
  generatedAtLabel: string;
  snapshotDate: string;
  from: string;
  to: string;
  periodLabel: string;
  collectionTitle: string;
  incomeTitle: string;
  schoolName: string;
  schoolAddress: string;
  classRows: DirectorClassRow[];
  academicStudents: number;
  hifzStudents: number;
  receivedRows: DirectorMoneyRow[];
  expenseRows: DirectorMoneyRow[];
  todayReceived: DirectorMoneyTotals;
  todayExpenses: DirectorMoneyTotals;
  totalReceived: DirectorMoneyTotals;
  totalExpenses: DirectorMoneyTotals;
  balanceCd: DirectorMoneyTotals;
  debitTotal: number;
  creditTotal: number;
  bankLines: DirectorBankLine[];
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

export type AssetStatus = 'active' | 'sold' | 'destroyed';

export type AssetValueEventType = 'revaluation' | 'depreciation' | 'sale' | 'destroy';

export interface SchoolAsset {
  id: string;
  assetNumber: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  purchaseValue: number;
  /** Book value after depreciation / revaluation */
  currentValue?: number;
  /** Annual depreciation percent; applied manually once a year */
  depreciationRate?: number;
  lastDepreciatedAt?: string;
  status?: AssetStatus;
  removedAt?: string;
  removalNote?: string;
  saleAmount?: number;
  saleIncomeId?: string;
  purchaseDate?: string;
  location?: string;
  usefulLifeYears?: number;
  condition: AssetCondition;
  serialNumber?: string;
  createdAt: string;
  updatedAt: string;
}

/** Audit trail when an asset is moved from one place to another */
export interface AssetLocationLog {
  id: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  reason?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface AssetValueLog {
  id: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  type: AssetValueEventType;
  previousValue: number;
  newValue: number;
  percent: number;
  date: string;
  note?: string;
  recordedBy?: string;
  createdAt: string;
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
  /** A built-in InvoiceFeeType or the id of a catalog item created by Accounts */
  key: string;
  label: string;
  /** Line total (unit price × quantity) */
  amount: number;
  quantity?: number;
  unitAmount?: number;
}

/** A billable item Accounts can put on a manual invoice (exam fee, khata, dress...) */
export interface InvoiceItemCategory {
  id: string;
  label: string;
  defaultAmount: number;
  /** Built-in rows ship with the system and cannot be deleted */
  builtIn?: boolean;
  archived?: boolean;
  createdBy?: string;
  createdAt: string;
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
  /** Free-text note printed on the invoice receipt */
  note?: string;
  /** Deposit slip / transaction number captured when the payment was taken */
  paymentReference?: string;
  paymentApprovalStatus?: 'pending' | 'approved' | 'rejected';
  pendingPaymentAmount?: number;
  pendingPaymentAccountId?: string;
  pendingPaymentMethod?: PaymentMethod;
  pendingPaymentReference?: string;
  paymentRequestedAt?: string;
  paymentRequestedBy?: string;
  createdBy?: string;
}

export type StaffAccessRole = Extract<UserRole, 'accounts'>;

export type StaffAccessStatus = 'active' | 'revoked';

/** Principal Office grants dashboard access to a person by email. */
export interface StaffAccessGrant {
  id: string;
  email: string;
  name: string;
  role: StaffAccessRole;
  status: StaffAccessStatus;
  grantedBy: string;
  grantedByEmail?: string;
  grantedAt: string;
  revokedBy?: string;
  revokedAt?: string;
  note?: string;
}

export interface SchoolSettings {
  schoolName: string;
  shortName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  eiin: string;
  academicYear: string;
  sessionLabel: string;
  principalName: string;
  currency: string;
  fiscalYearStartMonth: string;
  receiptFooter: string;
  smsEnabled: boolean;
  emailNotifyEnabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export type StaffTrack = 'teacher' | 'staff';

export type StaffHireStatus = 'pending_approval' | 'active' | 'rejected' | 'inactive';

export type StaffDocumentKind = 'cv' | 'nid' | 'appointment' | 'certificate' | 'other';

export interface StaffDocument {
  id: string;
  kind: StaffDocumentKind;
  name: string;
  url: string;
}

export type DutyKind =
  | 'class_teacher'
  | 'subject_teacher'
  | 'coordinator'
  | 'exam_incharge'
  | 'sports_incharge'
  | 'cultural_incharge'
  | 'discipline_incharge'
  | 'library_incharge'
  | 'transport_incharge'
  | 'office_duty'
  | 'maintenance'
  | 'other';

export type DutyStatus = 'pending' | 'active' | 'ended' | 'rejected';

export interface DutyAssignment {
  id: string;
  kind: DutyKind;
  title: string;
  className?: string;
  section?: string;
  note?: string;
  status: DutyStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewNote?: string;
}

export interface StaffMember {
  id: string;
  employeeId: string;
  track: StaffTrack;
  category: string;
  designation: string;
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
  photoUrl?: string;
  documents: StaffDocument[];
  duties: DutyAssignment[];
  status: StaffHireStatus;
  createdBy: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
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
