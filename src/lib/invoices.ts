import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { fetchFeeStructure } from './admissions';
import { ONLINE_PAYMENT_ACCOUNT_ID, recordCollection } from './ledger';
import { fetchStudents } from './students';
import { omitUndefined } from './utils';
import type {
  InvoiceFeeType,
  InvoiceLineItem,
  InvoiceStatus,
  PaymentMethod,
  Student,
  StudentInvoice,
} from '../types';

const INVOICES_COLLECTION = 'studentInvoices';
const LOCAL_INVOICES_KEY = 'an-noor-student-invoices';

export const OPTIONAL_FEE_TYPES: { key: InvoiceFeeType; label: string; defaultAmount: number }[] = [
  { key: 'examFee', label: 'Exam Fee', defaultAmount: 1200 },
  { key: 'busFee', label: 'Bus / Transport Fee', defaultAmount: 1500 },
  { key: 'sportsFee', label: 'Sports Charge', defaultAmount: 800 },
  { key: 'utilityBill', label: 'Utility Bill Share', defaultAmount: 500 },
  { key: 'other', label: 'Other Fee', defaultAmount: 0 },
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

export function formatBillingMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatBillingMonthLabel(billingMonth: string): string {
  const [year, month] = billingMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
}

export function computeDueDate(billingMonth: string): string {
  const [year, month] = billingMonth.split('-').map(Number);
  return new Date(year, month - 1, 15).toISOString().slice(0, 10);
}

function normalizeInvoice(data: StudentInvoice): StudentInvoice {
  const paidAmount = Number(data.paidAmount) || 0;
  const totalAmount = Number(data.totalAmount) || 0;
  let status = data.status;
  if (status !== 'cancelled') {
    if (paidAmount >= totalAmount && totalAmount > 0) status = 'paid';
    else if (paidAmount > 0) status = 'partial';
    else if (data.dueDate && data.dueDate < new Date().toISOString().slice(0, 10)) status = 'overdue';
    else status = 'pending';
  }

  return {
    ...data,
    totalAmount,
    paidAmount,
    status,
    lineItems: Array.isArray(data.lineItems) ? data.lineItems : [],
  };
}

async function getTuitionAmount(): Promise<number> {
  const structure = await fetchFeeStructure();
  const tuition = structure.items.find((item) => item.key === 'tuitionFee');
  return tuition?.amount ?? 4500;
}

function buildTuitionLineItem(amount: number, billingMonth: string): InvoiceLineItem {
  return {
    key: 'tuitionFee',
    label: `Tuition Fee — ${formatBillingMonthLabel(billingMonth)}`,
    amount,
  };
}

function invoiceHasTuition(invoice: StudentInvoice, billingMonth: string): boolean {
  return invoice.billingMonth === billingMonth && invoice.lineItems.some((item) => item.key === 'tuitionFee');
}

export async function fetchInvoices(filters?: {
  billingMonth?: string;
  studentId?: string;
  status?: InvoiceStatus;
}): Promise<StudentInvoice[]> {
  let invoices: StudentInvoice[];

  if (isDemoLoginEnabled) {
    invoices = readLocal<StudentInvoice[]>(LOCAL_INVOICES_KEY, []).map(normalizeInvoice);
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, INVOICES_COLLECTION)));
    invoices = snapshot.docs.map((document) => normalizeInvoice(document.data() as StudentInvoice));
  }

  if (filters?.billingMonth) {
    invoices = invoices.filter((invoice) => invoice.billingMonth === filters.billingMonth);
  }
  if (filters?.studentId) {
    invoices = invoices.filter((invoice) => invoice.studentId === filters.studentId);
  }
  if (filters?.status) {
    invoices = invoices.filter((invoice) => invoice.status === filters.status);
  }

  return invoices.sort((a, b) => b.billingMonth.localeCompare(a.billingMonth) || b.generatedAt.localeCompare(a.generatedAt));
}

async function generateInvoiceNumber(billingMonth: string): Promise<string> {
  const invoices = await fetchInvoices({ billingMonth });
  const monthKey = billingMonth.replace('-', '');
  const prefix = `INV-${monthKey}-`;
  const maxSeq = invoices
    .map((invoice) => invoice.invoiceNumber)
    .filter((number) => number.startsWith(prefix))
    .map((number) => parseInt(number.slice(prefix.length), 10))
    .filter((num) => !Number.isNaN(num))
    .reduce((max, num) => Math.max(max, num), 0);

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

function generateReceiptNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(now.getTime()).slice(-4);
  return `FEE-${datePart}-${seq}`;
}

async function saveInvoice(invoice: StudentInvoice, options?: { isNew?: boolean }): Promise<StudentInvoice> {
  const normalized = normalizeInvoice(invoice);

  if (isDemoLoginEnabled) {
    const all = readLocal<StudentInvoice[]>(LOCAL_INVOICES_KEY, []);
    const index = all.findIndex((item) => item.id === normalized.id);
    if (index >= 0) all[index] = normalized;
    else all.push(normalized);
    writeLocal(LOCAL_INVOICES_KEY, all);
    return normalized;
  }

  await waitForAuthUser();
  const payload = options?.isNew
    ? omitUndefined({ ...normalized, generatedAt: serverTimestamp() })
    : omitUndefined(normalized);
  await setDoc(doc(db, INVOICES_COLLECTION, normalized.id), payload, { merge: true });
  return normalized;
}

function buildInvoiceForStudent(params: {
  student: Student;
  billingMonth: string;
  tuitionAmount: number;
  invoiceNumber: string;
  academicYear?: string;
}): StudentInvoice {
  const lineItems = [buildTuitionLineItem(params.tuitionAmount, params.billingMonth)];
  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return normalizeInvoice({
    id: generateId('inv'),
    invoiceNumber: params.invoiceNumber,
    studentId: params.student.studentId,
    studentName: params.student.name,
    className: params.student.class,
    section: params.student.section,
    guardianContact: params.student.guardianContact,
    billingMonth: params.billingMonth,
    academicYear: params.academicYear ?? params.billingMonth.slice(0, 4),
    lineItems,
    totalAmount,
    paidAmount: 0,
    status: 'pending',
    dueDate: computeDueDate(params.billingMonth),
    generatedAt: new Date().toISOString(),
    autoGenerated: true,
  });
}

export interface GenerateMonthlyTuitionResult {
  billingMonth: string;
  created: number;
  skipped: number;
  invoices: StudentInvoice[];
}

export async function ensureMonthlyTuitionInvoices(billingMonth = formatBillingMonth()): Promise<GenerateMonthlyTuitionResult> {
  const [students, existingInvoices, tuitionAmount] = await Promise.all([
    fetchStudents(),
    fetchInvoices({ billingMonth }),
    getTuitionAmount(),
  ]);

  const activeStudents = students.filter((student) => student.status === 'Active');
  const createdInvoices: StudentInvoice[] = [];
  let skipped = 0;

  for (const student of activeStudents) {
    if (existingInvoices.some((invoice) => invoiceHasTuition(invoice, billingMonth) && invoice.studentId === student.studentId)) {
      skipped += 1;
      continue;
    }

    const invoiceNumber = await generateInvoiceNumber(billingMonth);
    const invoice = buildInvoiceForStudent({
      student,
      billingMonth,
      tuitionAmount,
      invoiceNumber,
      academicYear: student.academicYear,
    });
    await saveInvoice(invoice, { isNew: true });
    createdInvoices.push(invoice);
  }

  return {
    billingMonth,
    created: createdInvoices.length,
    skipped,
    invoices: createdInvoices,
  };
}

export interface CreateOptionalInvoiceInput {
  studentId: string;
  billingMonth: string;
  lineItems: InvoiceLineItem[];
}

export async function createOptionalInvoice(input: CreateOptionalInvoiceInput): Promise<StudentInvoice> {
  const students = await fetchStudents();
  const student = students.find((item) => item.studentId === input.studentId);
  if (!student) throw new Error('Student not found.');

  const totalAmount = input.lineItems.reduce((sum, item) => sum + item.amount, 0);
  if (totalAmount <= 0) throw new Error('Invoice amount must be greater than zero.');

  const invoiceNumber = await generateInvoiceNumber(input.billingMonth);
  const invoice = normalizeInvoice({
    id: generateId('inv'),
    invoiceNumber,
    studentId: student.studentId,
    studentName: student.name,
    className: student.class,
    section: student.section,
    guardianContact: student.guardianContact,
    billingMonth: input.billingMonth,
    academicYear: student.academicYear ?? input.billingMonth.slice(0, 4),
    lineItems: input.lineItems,
    totalAmount,
    paidAmount: 0,
    status: 'pending',
    dueDate: computeDueDate(input.billingMonth),
    generatedAt: new Date().toISOString(),
    autoGenerated: false,
  });

  return saveInvoice(invoice, { isNew: true });
}

export async function recordInvoicePayment(params: {
  invoiceId: string;
  amount: number;
  accountId: string;
  paymentMethod: PaymentMethod;
  gatewayRef?: string;
  gatewayProvider?: StudentInvoice['gatewayProvider'];
}): Promise<StudentInvoice> {
  const invoices = await fetchInvoices();
  const invoice = invoices.find((item) => item.id === params.invoiceId);
  if (!invoice) throw new Error('Invoice not found.');
  if (invoice.status === 'cancelled') throw new Error('Cancelled invoice cannot be paid.');
  if (params.amount <= 0) throw new Error('Payment amount must be greater than zero.');

  const remaining = invoice.totalAmount - invoice.paidAmount;
  if (params.amount > remaining) {
    throw new Error(`Payment exceeds due amount. Remaining: ৳ ${remaining.toLocaleString('en-BD')}`);
  }

  const paidAmount = invoice.paidAmount + params.amount;
  const receiptNumber = invoice.receiptNumber ?? generateReceiptNumber();
  const updated = normalizeInvoice({
    ...invoice,
    paidAmount,
    receiptNumber,
    paidAt: paidAmount >= invoice.totalAmount ? new Date().toISOString() : invoice.paidAt,
    paymentMethod: params.paymentMethod,
    paymentAccountId: params.accountId,
    gatewayRef: params.gatewayRef ?? invoice.gatewayRef,
    gatewayProvider: params.gatewayProvider ?? invoice.gatewayProvider,
  });

  await recordCollection({
    accountId: params.accountId,
    amount: params.amount,
    reference: `Fee Payment — ${invoice.invoiceNumber} (${invoice.studentName})`,
    relatedId: invoice.id,
    relatedType: 'invoice',
    note: params.gatewayRef ? `Gateway ref: ${params.gatewayRef}` : undefined,
  });

  return saveInvoice(updated);
}

export async function markInvoicePaidAtSchool(params: {
  invoiceId: string;
  accountId: string;
  paymentMethod: Exclude<PaymentMethod, 'gateway' | 'online'>;
}): Promise<StudentInvoice> {
  const invoices = await fetchInvoices();
  const invoice = invoices.find((item) => item.id === params.invoiceId);
  if (!invoice) throw new Error('Invoice not found.');

  return recordInvoicePayment({
    invoiceId: params.invoiceId,
    amount: invoice.totalAmount - invoice.paidAmount,
    accountId: params.accountId,
    paymentMethod: params.paymentMethod,
  });
}

export function computeInvoiceStats(invoices: StudentInvoice[]) {
  const pending = invoices.filter((invoice) => invoice.status === 'pending' || invoice.status === 'overdue' || invoice.status === 'partial');
  const paid = invoices.filter((invoice) => invoice.status === 'paid');
  const totalDue = pending.reduce((sum, invoice) => sum + (invoice.totalAmount - invoice.paidAmount), 0);
  const totalCollected = paid.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return {
    pendingCount: pending.length,
    paidCount: paid.length,
    totalDue,
    totalCollected,
  };
}

export async function cancelInvoice(invoiceId: string): Promise<StudentInvoice> {
  const invoices = await fetchInvoices();
  const invoice = invoices.find((item) => item.id === invoiceId);
  if (!invoice) throw new Error('Invoice not found.');
  if (invoice.paidAmount > 0) throw new Error('Paid invoice cannot be cancelled.');

  const updated = normalizeInvoice({ ...invoice, status: 'cancelled' });

  if (isDemoLoginEnabled) {
    return saveInvoice(updated);
  }

  await waitForAuthUser();
  await updateDoc(doc(db, INVOICES_COLLECTION, invoiceId), { status: 'cancelled' });
  return updated;
}
