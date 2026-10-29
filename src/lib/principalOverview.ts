import { fetchAdmissions } from './admissions';
import { bookValue, fetchAssets, isAssetActive } from './assets';
import { rangeIncomeExpense } from './dayClose';
import { fetchExpenses } from './expenses';
import { fetchIncomeEntries } from './income';
import { fetchInvoices } from './invoices';
import { computeAllBalances, fetchAccounts, fetchEntries } from './ledger';
import { fetchStudents } from './students';
import type { Admission, Expense, IncomeEntry, LedgerAccount, LedgerEntry, SchoolAsset, Student, StudentInvoice } from '../types';

export function localToday(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export interface PrincipalData {
  accounts: LedgerAccount[];
  entries: LedgerEntry[];
  expenses: Expense[];
  incomeEntries: IncomeEntry[];
  invoices: StudentInvoice[];
  admissions: Admission[];
  students: Student[];
  assets: SchoolAsset[];
}

/** Loads everything the Principal overview needs (each source fails soft to empty). */
export async function fetchPrincipalData(): Promise<PrincipalData> {
  const r = await Promise.allSettled([
    fetchAccounts(), fetchEntries(), fetchExpenses(), fetchIncomeEntries(),
    fetchInvoices(), fetchAdmissions(), fetchStudents(), fetchAssets(),
  ]);
  const v = <T,>(i: number): T[] => (r[i].status === 'fulfilled' ? (r[i] as PromiseFulfilledResult<T[]>).value : []);
  return {
    accounts: v<LedgerAccount>(0), entries: v<LedgerEntry>(1), expenses: v<Expense>(2), incomeEntries: v<IncomeEntry>(3),
    invoices: v<StudentInvoice>(4), admissions: v<Admission>(5), students: v<Student>(6), assets: v<SchoolAsset>(7),
  };
}

export function netLiquidity(data: PrincipalData) {
  const balances = computeAllBalances(data.accounts, data.entries);
  return { total: balances.reduce((s, b) => s + b.balance, 0), balances };
}

export function incomeExpense(data: PrincipalData, from: string, to: string) {
  return rangeIncomeExpense(data.entries, data.expenses, from, to);
}

export interface MoneyRow {
  id: string;
  date: string;
  createdAt?: string;
  kind: 'income' | 'expense';
  category: string;
  description: string;
  accountName: string;
  amount: number;
  enteredBy: string;
}

/** Every income/expense line in the range, using the same sources as the totals. */
export function moneyRows(data: PrincipalData, from: string, to: string): MoneyRow[] {
  const accountName = (id?: string) => data.accounts.find((a) => a.id === id)?.name ?? id ?? '—';
  const expenseById = new Map(data.expenses.map((e) => [e.id, e]));
  const incomeById = new Map(data.incomeEntries.map((e) => [e.id, e]));
  const admissionById = new Map(data.admissions.map((a) => [a.id, a]));
  const invoiceById = new Map(data.invoices.map((i) => [i.id, i]));
  const inRange = (d: string) => d.slice(0, 10) >= from && d.slice(0, 10) <= to;

  const rows: MoneyRow[] = data.entries.filter((e) => inRange(e.date)).map((entry) => {
    let category = 'Other';
    let enteredBy = '—';
    const rel = entry.relatedId;
    if (entry.relatedType === 'expense' && rel && expenseById.get(rel)) {
      const ex = expenseById.get(rel)!; category = ex.category; enteredBy = ex.createdBy ?? '—';
    } else if (entry.relatedType === 'income' && rel && incomeById.get(rel)) {
      const inc = incomeById.get(rel)!; category = inc.category; enteredBy = inc.createdBy ?? '—';
    } else if (entry.relatedType === 'admission') {
      category = 'Admission Fee'; enteredBy = (rel && admissionById.get(rel)?.createdBy) || '—';
    } else if (entry.relatedType === 'invoice') {
      category = 'Fee Collection (Invoice)'; enteredBy = (rel && invoiceById.get(rel)?.paymentRequestedBy) || '—';
    } else if (entry.relatedType === 'transfer') category = 'Account Transfer';
    else if (entry.relatedType === 'reversal') category = 'Reversal';
    else if (entry.relatedType === 'inventory') category = 'Inventory';
    return {
      id: entry.id, date: entry.date.slice(0, 10), createdAt: entry.createdAt,
      kind: entry.type === 'credit' ? 'income' : 'expense', category,
      description: entry.reference, accountName: accountName(entry.accountId), amount: entry.amount, enteredBy,
    };
  });

  for (const ex of rangeIncomeExpense(data.entries, data.expenses, from, to).unpostedExpenses) {
    const full = expenseById.get(ex.id);
    rows.push({
      id: ex.id, date: ex.date.slice(0, 10), createdAt: full?.createdAt, kind: 'expense',
      category: full?.category ?? 'Expense', description: `${full?.description ?? ''} (ledger-এ post হয়নি${full?.approvalStatus ? ` • ${full.approvalStatus}` : ''})`,
      accountName: accountName(full?.accountId), amount: ex.amount, enteredBy: full?.createdBy ?? '—',
    });
  }
  return rows.sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date));
}

export interface DueRow { studentId: string; studentName: string; className: string; items: string; due: number; overdue: boolean }

/** Unpaid / partial / overdue invoices + approved admissions with a due but no due invoice yet. */
export function uncollectedDues(data: PrincipalData): { total: number; rows: DueRow[] } {
  const map = new Map<string, DueRow>();
  const add = (studentId: string, studentName: string, className: string, item: string, due: number, overdue: boolean) => {
    if (due <= 0) return;
    const row = map.get(studentId) ?? { studentId, studentName, className, items: '', due: 0, overdue: false };
    row.due += due; row.overdue = row.overdue || overdue;
    row.items = row.items ? `${row.items}, ${item}` : item;
    map.set(studentId, row);
  };
  for (const inv of data.invoices) {
    if (!['pending', 'partial', 'overdue'].includes(inv.status)) continue;
    add(inv.studentId, inv.studentName, `${inv.className}${inv.section ? ` – ${inv.section}` : ''}`,
      `${inv.invoiceNumber} (${inv.lineItems.map((l) => l.label).join(', ')})`, inv.totalAmount - inv.paidAmount, inv.status === 'overdue');
  }
  for (const adm of data.admissions) {
    if (adm.status !== 'approved' || adm.dueInvoiceId || !adm.studentId) continue;
    const due = (adm.dueAmount ?? 0);
    add(adm.studentId, adm.studentName, adm.classApplied, `Admission due ${adm.formSerial}`, due, false);
  }
  const rows = [...map.values()].sort((a, b) => b.due - a.due);
  return { total: rows.reduce((s, r) => s + r.due, 0), rows };
}

export function assetSummary(data: PrincipalData) {
  const active = data.assets.filter(isAssetActive);
  return { count: active.length, value: active.reduce((s, a) => s + bookValue(a), 0), active };
}

export function enrollment(data: PrincipalData) {
  const active = data.students.filter((s) => s.status === 'Active');
  const byClass = new Map<string, number>();
  for (const s of active) {
    const key = s.section ? `${s.class} – ${s.section}` : s.class;
    byClass.set(key, (byClass.get(key) ?? 0) + 1);
  }
  return { count: active.length, byClass: [...byClass.entries()].map(([name, students]) => ({ name, students })) };
}
