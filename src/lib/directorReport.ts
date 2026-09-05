import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { fetchAdmissions } from './admissions';
import { fetchExpenses } from './expenses';
import { fetchIncomeEntries } from './income';
import { fetchInvoices } from './invoices';
import { fetchAccounts, fetchEntries, isEntryReversed } from './ledger';
import { CLASS_OPTIONS } from './schoolConstants';
import { getSchoolAddress, getSchoolName } from './receipts';
import { fetchStudents } from './students';
import type {
  Admission,
  DirectorBriefing,
  DirectorClassRow,
  DirectorMoneyRow,
  DirectorMoneyTotals,
  Expense,
  LedgerAccount,
  LedgerEntry,
  Student,
  StudentInvoice,
} from '../types';

const HIFZ_CLASSES = ['Full Time Hifz', 'Part Time Hifz', 'Quran Learning'] as const;

const CLASS_DISPLAY: Record<string, string> = {
  'Class 1': 'Class I',
  'Class 2': 'Class II',
  'Class 3': 'Class III',
  'Class 4': 'Class IV',
  'Class 5': 'Class V',
  'Class 6': 'Class VI',
  'Class 7': 'Class VII',
  'Class 8': 'Class VIII',
};

const ROMAN_CLASS: Record<string, string> = {
  'class i': 'Class 1',
  'class ii': 'Class 2',
  'class iii': 'Class 3',
  'class iv': 'Class 4',
  'class v': 'Class 5',
  'class vi': 'Class 6',
  'class vii': 'Class 7',
  'class viii': 'Class 8',
};

function inRange(dateIso: string, from: string, to: string): boolean {
  const date = dateIso.slice(0, 10);
  return date >= from && date <= to;
}

function canonicalClass(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Unassigned';
  const lower = trimmed.toLowerCase();
  if (ROMAN_CLASS[lower]) return ROMAN_CLASS[lower];
  const numbered = lower.match(/^class\s*0?(\d)$/);
  if (numbered) return `Class ${numbered[1]}`;
  const known = CLASS_OPTIONS.find((option) => option.toLowerCase() === lower);
  if (known) return known;
  const hifz = HIFZ_CLASSES.find((option) => option.toLowerCase() === lower);
  return hifz ?? trimmed;
}

function displayClass(name: string): string {
  return CLASS_DISPLAY[name] ?? name;
}

export function isHifzClass(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('hifz') || lower.includes('quran');
}

function classOrder(): string[] {
  return [...CLASS_OPTIONS, ...HIFZ_CLASSES];
}

function periodLabel(from: string, to: string, mode: 'month' | 'year' | 'custom'): string {
  if (mode === 'month') {
    const [year, month] = from.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
  }
  if (mode === 'year') return from.slice(0, 4);
  return `${from} to ${to}`;
}

function snapshotDateLabel(iso: string): string {
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}

function generatedLabel(iso: string): string {
  return new Date(iso).toLocaleString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function billingMonthsInRange(from: string, to: string): { start: string; end: string } {
  return { start: from.slice(0, 7), end: to.slice(0, 7) };
}

function monthName(billingMonth: string): string {
  const [year, month] = billingMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-BD', { month: 'long' });
}

function isTuitionLine(key: string, label: string): boolean {
  return key === 'tuitionFee' || /tuition/i.test(label);
}

function isExamLine(key: string, label: string): boolean {
  return key === 'examFee' || /exam/i.test(label);
}

function isPrincipalApprovedPayment(invoice: StudentInvoice): boolean {
  if (invoice.paymentApprovalStatus === 'pending' || invoice.paymentApprovalStatus === 'rejected') {
    return false;
  }
  return invoice.status === 'paid' || invoice.paidAmount > 0;
}

function isPrincipalApprovedExpense(status: Expense['approvalStatus']): boolean {
  return status === 'approved';
}

function allocateInvoice(invoice: StudentInvoice): {
  tuitionCollected: number;
  tuitionDue: number;
  examCollected: number;
  examDue: number;
} {
  const tuitionAmt = invoice.lineItems
    .filter((item) => isTuitionLine(item.key, item.label))
    .reduce((sum, item) => sum + item.amount, 0);
  const examAmt = invoice.lineItems
    .filter((item) => isExamLine(item.key, item.label))
    .reduce((sum, item) => sum + item.amount, 0);

  if (invoice.status === 'cancelled') {
    return { tuitionCollected: 0, tuitionDue: 0, examCollected: 0, examDue: 0 };
  }
  if (invoice.status === 'paid') {
    return {
      tuitionCollected: tuitionAmt,
      tuitionDue: 0,
      examCollected: examAmt,
      examDue: 0,
    };
  }

  let remaining = Math.max(0, invoice.paidAmount);
  const tuitionPaid = Math.min(remaining, tuitionAmt);
  remaining -= tuitionPaid;
  const examPaid = Math.min(remaining, examAmt);
  return {
    tuitionCollected: tuitionPaid,
    tuitionDue: Math.max(0, tuitionAmt - tuitionPaid),
    examCollected: examPaid,
    examDue: Math.max(0, examAmt - examPaid),
  };
}

function isCashAccount(account: LedgerAccount | undefined): boolean {
  return account?.type === 'cash';
}

function splitByAccount(
  amount: number,
  accountId: string | undefined,
  accounts: Map<string, LedgerAccount>,
  fallbackCash: boolean,
): { cash: number; bank: number } {
  if (!amount) return { cash: 0, bank: 0 };
  const account = accountId ? accounts.get(accountId) : undefined;
  if (account) {
    return isCashAccount(account) ? { cash: amount, bank: 0 } : { cash: 0, bank: amount };
  }
  return fallbackCash ? { cash: amount, bank: 0 } : { cash: 0, bank: amount };
}

function balanceBefore(
  account: LedgerAccount,
  entries: LedgerEntry[],
  beforeDate: string,
): number {
  const relevant = entries.filter(
    (entry) =>
      entry.accountId === account.id &&
      !isEntryReversed(entry, entries) &&
      entry.date.slice(0, 10) < beforeDate,
  );
  const credits = relevant.filter((entry) => entry.type === 'credit').reduce((sum, entry) => sum + entry.amount, 0);
  const debits = relevant.filter((entry) => entry.type === 'debit').reduce((sum, entry) => sum + entry.amount, 0);
  return account.openingBalance + credits - debits;
}

function emptyMoney(): DirectorMoneyTotals {
  return { cash: 0, bank: 0, total: 0 };
}

function addMoney(a: DirectorMoneyTotals, cash: number, bank: number): DirectorMoneyTotals {
  return { cash: a.cash + cash, bank: a.bank + bank, total: a.total + cash + bank };
}

function moneyRow(
  sl: string,
  label: string,
  cash: number,
  bank: number,
  voucherNo = '',
): DirectorMoneyRow {
  return {
    sl,
    voucherNo,
    label,
    folio: '',
    cash,
    bank,
    total: cash + bank,
    isEmpty: false,
  };
}

function emptyRow(sl: string): DirectorMoneyRow {
  return { sl, voucherNo: '', label: '', folio: '', cash: 0, bank: 0, total: 0, isEmpty: true };
}

function padRows(rows: DirectorMoneyRow[], min: number): DirectorMoneyRow[] {
  const padded = [...rows];
  let next = padded.length + 1;
  while (padded.length < min) {
    padded.push(emptyRow(String(next).padStart(2, '0')));
    next += 1;
  }
  return padded;
}

function previousDuesNote(
  invoices: StudentInvoice[],
  className: string,
  beforeMonth: string,
): string {
  const unpaid = invoices.filter((invoice) => {
    if (canonicalClass(invoice.className) !== className) return false;
    if (invoice.status === 'cancelled' || invoice.status === 'paid') return false;
    if (invoice.billingMonth >= beforeMonth) return false;
    return invoice.totalAmount > invoice.paidAmount;
  });
  if (unpaid.length === 0) return 'Full Paid';

  const byMonth = new Map<string, Set<string>>();
  for (const invoice of unpaid) {
    const set = byMonth.get(invoice.billingMonth) ?? new Set<string>();
    set.add(invoice.studentId || invoice.id);
    byMonth.set(invoice.billingMonth, set);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, students]) => {
      const count = students.size;
      return `${monthName(month)} = ${count} ${count === 1 ? 'Person' : 'Persons'}`;
    })
    .join(', ');
}

function classShiftedNote(
  students: Student[],
  admissions: Admission[],
  className: string,
  from: string,
  to: string,
): string {
  const notes: string[] = [];
  const newHere = admissions.filter(
    (admission) =>
      admission.status === 'approved' &&
      inRange(admission.updatedAt, from, to) &&
      canonicalClass(admission.classApplied) === className &&
      admission.studentId,
  );
  for (const admission of newHere) {
    const student = students.find((item) => item.studentId === admission.studentId);
    if (student && canonicalClass(student.class) !== className) {
      notes.push(`1 (${displayClass(canonicalClass(student.class))})`);
    }
  }
  return notes.join(', ');
}

export async function getDirectorBriefing(
  from: string,
  to: string,
  mode: 'month' | 'year' | 'custom' = 'month',
): Promise<DirectorBriefing> {
  const generatedAt = new Date().toISOString();
  const [students, admissions, invoices, expenses, incomeEntries, accounts, entries] = await Promise.all([
    fetchStudents(),
    fetchAdmissions(),
    fetchInvoices(),
    fetchExpenses(),
    fetchIncomeEntries(),
    fetchAccounts(),
    fetchEntries(),
  ]);

  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const { start: monthStart, end: monthEnd } = billingMonthsInRange(from, to);
  const extraClasses = [
    ...students.map((student) => canonicalClass(student.class)),
    ...admissions.map((admission) => canonicalClass(admission.classApplied)),
    ...invoices.map((invoice) => canonicalClass(invoice.className)),
  ].filter((name) => name && !classOrder().includes(name) && name !== 'Unassigned');

  const classNames = [...classOrder(), ...[...new Set(extraClasses)]];

  const classRows: DirectorClassRow[] = classNames.map((className) => {
    const inClass = students.filter((student) => canonicalClass(student.class) === className);
    const active = inClass.filter((student) => student.status !== 'Inactive');
    const left = inClass.filter((student) => student.status === 'Inactive').length;
    const newStudents = admissions.filter(
      (admission) =>
        admission.status === 'approved' &&
        inRange(admission.updatedAt, from, to) &&
        canonicalClass(admission.classApplied) === className,
    ).length;

    const monthInvoices = invoices.filter((invoice) => {
      if (canonicalClass(invoice.className) !== className) return false;
      if (invoice.status === 'cancelled') return false;
      return invoice.billingMonth >= monthStart && invoice.billingMonth <= monthEnd;
    });

    const collectionInvoices = monthInvoices.map((invoice) =>
      isPrincipalApprovedPayment(invoice)
        ? invoice
        : { ...invoice, paidAmount: 0, status: invoice.status === 'paid' ? 'pending' : invoice.status },
    );

    const fees = collectionInvoices.reduce(
      (acc, invoice) => {
        const part = allocateInvoice(invoice);
        return {
          tuitionCollected: acc.tuitionCollected + part.tuitionCollected,
          tuitionDues: acc.tuitionDues + part.tuitionDue,
          examCollected: acc.examCollected + part.examCollected,
          examDues: acc.examDues + part.examDue,
        };
      },
      { tuitionCollected: 0, tuitionDues: 0, examCollected: 0, examDues: 0 },
    );

    return {
      className,
      displayName: displayClass(className),
      totalStudents: active.length,
      newStudents,
      classShifted: classShiftedNote(students, admissions, className, from, to),
      leftStudents: left,
      tuitionCollected: fees.tuitionCollected,
      tuitionDues: fees.tuitionDues,
      examCollected: fees.examCollected,
      examDues: fees.examDues,
      previousDuesNote: previousDuesNote(invoices, className, monthStart),
      isHifz: isHifzClass(className),
    };
  });

  const academicStudents = classRows.filter((row) => !row.isHifz).reduce((sum, row) => sum + row.totalStudents, 0);
  const hifzStudents = classRows.filter((row) => row.isHifz).reduce((sum, row) => sum + row.totalStudents, 0);

  const openingCash = accounts
    .filter((account) => account.type === 'cash')
    .reduce((sum, account) => sum + balanceBefore(account, entries, from), 0);
  const openingBank = accounts
    .filter((account) => account.type !== 'cash')
    .reduce((sum, account) => sum + balanceBefore(account, entries, from), 0);

  const paidInvoices = invoices.filter(
    (invoice) =>
      isPrincipalApprovedPayment(invoice) &&
      invoice.paidAmount > 0 &&
      inRange(invoice.paidAt ?? invoice.generatedAt, from, to),
  );
  const approvedAdmissions = admissions.filter(
    (admission) => admission.status === 'approved' && inRange(admission.updatedAt, from, to),
  );
  const approvedIncome = incomeEntries.filter(
    (entry) => entry.approvalStatus === 'approved' && inRange(entry.date, from, to),
  );
  const approvedExpenses = expenses.filter(
    (expense) => inRange(expense.date, from, to) && isPrincipalApprovedExpense(expense.approvalStatus),
  );

  let tuitionCash = 0;
  let tuitionBank = 0;
  let examCash = 0;
  let examBank = 0;
  for (const invoice of paidInvoices) {
    const { tuitionCollected, examCollected } = allocateInvoice(invoice);
    const methodCash = invoice.paymentMethod === 'cash';
    const tuitionSplit = splitByAccount(tuitionCollected, invoice.paymentAccountId, accountMap, methodCash);
    const examSplit = splitByAccount(examCollected, invoice.paymentAccountId, accountMap, methodCash);
    tuitionCash += tuitionSplit.cash;
    tuitionBank += tuitionSplit.bank;
    examCash += examSplit.cash;
    examBank += examSplit.bank;
  }

  let admissionCash = 0;
  let admissionBank = 0;
  for (const admission of approvedAdmissions) {
    const split = splitByAccount(admission.grandTotal, admission.receivedInAccountId, accountMap, true);
    admissionCash += split.cash;
    admissionBank += split.bank;
  }

  const incomeByCategory = new Map<string, { cash: number; bank: number; voucher: string }>();
  for (const entry of approvedIncome) {
    const methodCash = entry.paymentMethod === 'cash';
    const split = splitByAccount(entry.amount, entry.accountId, accountMap, methodCash);
    const current = incomeByCategory.get(entry.category) ?? { cash: 0, bank: 0, voucher: entry.receiptNumber };
    current.cash += split.cash;
    current.bank += split.bank;
    if (!current.voucher) current.voucher = entry.receiptNumber;
    incomeByCategory.set(entry.category, current);
  }

  const receivedSource: DirectorMoneyRow[] = [
    moneyRow('01', 'Balance B/D', openingCash, openingBank),
    moneyRow('02', 'Tuition Fee Collected', tuitionCash, tuitionBank),
  ];
  let sl = 3;
  if (examCash + examBank > 0) {
    receivedSource.push(moneyRow(String(sl).padStart(2, '0'), 'Exam Fee Collected', examCash, examBank));
    sl += 1;
  }
  if (admissionCash + admissionBank > 0) {
    receivedSource.push(moneyRow(String(sl).padStart(2, '0'), 'Admission Fee', admissionCash, admissionBank));
    sl += 1;
  }
  for (const [category, value] of [...incomeByCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    receivedSource.push(
      moneyRow(String(sl).padStart(2, '0'), category, value.cash, value.bank, value.voucher),
    );
    sl += 1;
  }

  const expenseByCategory = new Map<string, { cash: number; bank: number; voucher: string }>();
  for (const expense of approvedExpenses) {
    const split = splitByAccount(expense.amount, expense.accountId, accountMap, true);
    const current = expenseByCategory.get(expense.category) ?? {
      cash: 0,
      bank: 0,
      voucher: expense.voucherNumber ?? '',
    };
    current.cash += split.cash;
    current.bank += split.bank;
    if (!current.voucher && expense.voucherNumber) current.voucher = expense.voucherNumber;
    expenseByCategory.set(expense.category, current);
  }

  const expenseSource: DirectorMoneyRow[] = [...expenseByCategory.entries()]
    .sort((a, b) => b[1].cash + b[1].bank - (a[1].cash + a[1].bank))
    .map(([category, value], index) =>
      moneyRow(String(index + 1).padStart(2, '0'), category, value.cash, value.bank, value.voucher),
    );

  const rowCount = Math.max(10, receivedSource.length, expenseSource.length);
  const receivedRows = padRows(receivedSource, rowCount);
  const expenseRows = padRows(expenseSource, rowCount);

  const todayReceived = receivedSource.slice(1).reduce((acc, row) => addMoney(acc, row.cash, row.bank), emptyMoney());
  const todayExpenses = expenseSource.reduce((acc, row) => addMoney(acc, row.cash, row.bank), emptyMoney());
  const totalReceived = addMoney(todayReceived, openingCash, openingBank);
  const totalExpenses = todayExpenses;
  const balanceCd: DirectorMoneyTotals = {
    cash: totalReceived.cash - totalExpenses.cash,
    bank: totalReceived.bank - totalExpenses.bank,
    total: totalReceived.total - totalExpenses.total,
  };

  const bankLines = accounts
    .filter((account) => account.type === 'bank' || account.type === 'mobile')
    .map((account) => ({
      name: account.name,
      balance: account.openingBalance
        + entries
          .filter((entry) => entry.accountId === account.id && !isEntryReversed(entry, entries))
          .reduce((sum, entry) => sum + (entry.type === 'credit' ? entry.amount : -entry.amount), 0),
    }));

  const label = periodLabel(from, to, mode);

  return {
    generatedAt,
    generatedAtLabel: generatedLabel(generatedAt),
    snapshotDate: snapshotDateLabel(generatedAt),
    from,
    to,
    periodLabel: label,
    collectionTitle: `Monthly Tuition Fee Collection ( ${label} )`,
    incomeTitle: 'Monthly Income & Expense (Approximately)',
    schoolName: getSchoolName(),
    schoolAddress: getSchoolAddress(),
    classRows,
    academicStudents,
    hifzStudents,
    receivedRows,
    expenseRows,
    todayReceived,
    todayExpenses,
    totalReceived,
    totalExpenses,
    balanceCd,
    debitTotal: totalReceived.total,
    creditTotal: totalReceived.total,
    bankLines,
  };
}

async function waitForImages(root: HTMLElement): Promise<void> {
  await Promise.all(
    Array.from(root.querySelectorAll('img')).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

export async function downloadDirectorBriefingPdf(root: HTMLElement, fileBase: string): Promise<void> {
  await waitForImages(root);
  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-director-page]'));
  if (pages.length === 0) {
    throw new Error('Report pages ready হয়নি। আবার চেষ্টা করুন।');
  }

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 6;

  for (let index = 0; index < pages.length; index += 1) {
    const canvas = await html2canvas(pages[index], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const image = canvas.toDataURL('image/png');
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = canvas.height / canvas.width;
    let renderW = maxW;
    let renderH = renderW * ratio;
    if (renderH > maxH) {
      renderH = maxH;
      renderW = renderH / ratio;
    }
    const x = (pageW - renderW) / 2;
    const y = (pageH - renderH) / 2;
    if (index > 0) pdf.addPage();
    pdf.addImage(image, 'PNG', x, y, renderW, renderH, undefined, 'FAST');
  }

  pdf.save(`${fileBase}.pdf`);
}

export function directorReportFileBase(briefing: DirectorBriefing): string {
  const stamp = briefing.generatedAt.slice(0, 16).replace(/[-:T]/g, '');
  const period = briefing.periodLabel.replace(/[^A-Za-z0-9]+/g, '-');
  return `An-Noor-Director-Report-${period}-${stamp}`;
}
