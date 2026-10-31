import { omitUndefined } from './utils';
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { toIsoString } from './utils';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { computeAllBalances, effectiveEntries, fetchAccounts, fetchEntries } from './ledger';
import { fetchExpenses } from './expenses';
import type { DayCloseRecord, LedgerEntry } from '../types';

const DAY_CLOSE_COLLECTION = 'dayCloseRecords';
const LOCAL_DAY_CLOSE_KEY = 'an-noor-day-close';

const CASH_DEPOSIT_THRESHOLD = 50000;

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

function isSameDay(dateStr: string, targetDate: string): boolean {
  return dateStr.slice(0, 10) === targetDate;
}

function sumEntries(entries: LedgerEntry[], type: 'credit' | 'debit'): number {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

/**
 * Income / expense between two yyyy-mm-dd dates (inclusive) — the exact Day Close logic:
 * income = ledger credits; expense = ledger debits + expenses not yet posted to the ledger.
 * Shared with the Principal dashboard so both screens always match.
 */
export function rangeIncomeExpense(
  entries: LedgerEntry[],
  expenses: { id: string; date: string; amount: number }[],
  from: string,
  to: string,
): { totalIncome: number; totalExpense: number; unpostedExpenses: { id: string; date: string; amount: number }[] } {
  const inRange = (value: string) => value.slice(0, 10) >= from && value.slice(0, 10) <= to;
  // Reversal pairs cancel out; internal transfers only move money between school accounts.
  const rangeEntries = effectiveEntries(entries).filter((entry) => inRange(entry.date) && entry.relatedType !== 'transfer');
  const ledgerExpenseIds = new Set(
    entries.filter((entry) => entry.relatedType === 'expense' && entry.relatedId).map((entry) => entry.relatedId as string),
  );
  const unpostedExpenses = expenses.filter((expense) => inRange(expense.date) && !ledgerExpenseIds.has(expense.id));
  return {
    totalIncome: sumEntries(rangeEntries, 'credit'),
    totalExpense: sumEntries(rangeEntries, 'debit') + unpostedExpenses.reduce((s, e) => s + e.amount, 0),
    unpostedExpenses,
  };
}

export async function getDailySummary(date: string): Promise<Omit<DayCloseRecord, 'id' | 'closedBy' | 'closedAt' | 'note'>> {
  const [accounts, entries, expenses] = await Promise.all([
    fetchAccounts(),
    fetchEntries(),
    fetchExpenses(),
  ]);

  const todayEntries = effectiveEntries(entries).filter((entry) => isSameDay(entry.date, date));
  const { totalIncome, totalExpense } = rangeIncomeExpense(entries, expenses, date, date);
  const balances = computeAllBalances(accounts, entries);

  const accountSnapshots = balances.map(({ account, balance }) => {
    const accountEntries = todayEntries.filter((entry) => entry.accountId === account.id);
    return {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      balance,
      todayIncome: sumEntries(accountEntries, 'credit'),
      todayExpense: sumEntries(accountEntries, 'debit'),
    };
  });

  const depositReminders = accountSnapshots
    .filter((snapshot) => snapshot.accountType === 'cash' && snapshot.balance >= CASH_DEPOSIT_THRESHOLD)
    .map((snapshot) => ({
      accountId: snapshot.accountId,
      accountName: snapshot.accountName,
      cashInHand: snapshot.balance,
      suggestedDeposit: Math.max(0, snapshot.balance - 10000),
      message: `${snapshot.accountName}-এ ৳${snapshot.balance.toLocaleString()} cash আছে। Bank/MFS-এ জমা দিন।`,
    }));

  return {
    date,
    totalIncome,
    totalExpense,
    netCash: totalIncome - totalExpense,
    accountSnapshots,
    depositReminders,
  };
}

export async function fetchDayCloseRecords(): Promise<DayCloseRecord[]> {
  if (isDemoLoginEnabled) {
    return readLocal<DayCloseRecord[]>(LOCAL_DAY_CLOSE_KEY, []).sort((a, b) => b.date.localeCompare(a.date));
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, DAY_CLOSE_COLLECTION)));
  return snapshot.docs
    .map((document) => document.data() as DayCloseRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function normalizeRecord(data: DayCloseRecord): DayCloseRecord {
  return {
    ...data,
    requestedAt: data.requestedAt ? toIsoString(data.requestedAt) : undefined,
    approvedAt: data.approvedAt ? toIsoString(data.approvedAt) : undefined,
    rejectedAt: data.rejectedAt ? toIsoString(data.rejectedAt) : undefined,
    closedAt: data.closedAt ? toIsoString(data.closedAt) : undefined,
  };
}

export function dayCloseStatus(record?: DayCloseRecord | null): 'none' | 'pending_approval' | 'approved' | 'rejected' {
  if (!record) return 'none';
  return record.status ?? 'approved';
}

/** The close record for a date (approved one wins, else the latest request). */
export async function getDayCloseRecord(date: string): Promise<DayCloseRecord | null> {
  let records: DayCloseRecord[];
  if (isDemoLoginEnabled) {
    records = readLocal<DayCloseRecord[]>(LOCAL_DAY_CLOSE_KEY, []).filter((record) => record.date === date);
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, DAY_CLOSE_COLLECTION), where('date', '==', date)));
    records = snapshot.docs.map((d) => normalizeRecord(d.data() as DayCloseRecord));
  }
  if (records.length === 0) return null;
  return (
    records.find((record) => dayCloseStatus(record) === 'approved') ??
    records.sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''))[0]
  );
}

export async function fetchPendingDayCloses(): Promise<DayCloseRecord[]> {
  const records = await fetchDayCloseRecords();
  return records.map(normalizeRecord).filter((record) => record.status === 'pending_approval');
}

/** A day is locked only after the Principal approves its close. */
export async function isDayClosed(date: string): Promise<boolean> {
  return dayCloseStatus(await getDayCloseRecord(date)) === 'approved';
}

async function writeRecord(record: DayCloseRecord, isNew: boolean) {
  if (isDemoLoginEnabled) {
    const existing = readLocal<DayCloseRecord[]>(LOCAL_DAY_CLOSE_KEY, []).filter((r) => r.id !== record.id);
    writeLocal(LOCAL_DAY_CLOSE_KEY, [...existing, record]);
    return;
  }
  await waitForAuthUser();
  const ref = doc(db, DAY_CLOSE_COLLECTION, record.id);
  const data = omitUndefined({ ...record } as Record<string, unknown>);
  if (isNew) await setDoc(ref, data);
  else await updateDoc(ref, data);
}

/** Accounts submits the day close; the Principal must approve before the day is locked. */
export async function submitDayClose(params: { date: string; requestedBy: string; note?: string }): Promise<DayCloseRecord> {
  const current = await getDayCloseRecord(params.date);
  const status = dayCloseStatus(current);
  if (status === 'approved') throw new Error('This day is already closed.');
  if (status === 'pending_approval') throw new Error('This day close is already pending approval.');

  const summary = await getDailySummary(params.date);
  const record: DayCloseRecord = {
    id: current?.id ?? `day-${params.date}`,
    ...summary,
    note: params.note,
    status: 'pending_approval',
    requestedBy: params.requestedBy,
    requestedAt: new Date().toISOString(),
    ...(current?.rejectReason
      ? { rejectedBy: current.rejectedBy, rejectedAt: current.rejectedAt, rejectReason: current.rejectReason }
      : {}),
  };
  await writeRecord(record, !current);
  return record;
}

export async function reviewDayClose(params: {
  record: DayCloseRecord;
  action: 'approved' | 'rejected';
  reviewedBy: string;
  note?: string;
}): Promise<DayCloseRecord> {
  const now = new Date().toISOString();
  if (params.action === 'rejected' && !params.note?.trim()) throw new Error('Reject করার জন্য কারণ লিখুন।');
  const updated: DayCloseRecord =
    params.action === 'approved'
      ? { ...params.record, status: 'approved', approvedBy: params.reviewedBy, approvedAt: now, closedBy: params.reviewedBy, closedAt: now }
      : { ...params.record, status: 'rejected', rejectedBy: params.reviewedBy, rejectedAt: now, rejectReason: params.note?.trim() };
  await writeRecord(updated, false);
  return updated;
}

/** @deprecated use submitDayClose */
export async function closeDay(params: { date: string; closedBy: string; note?: string }): Promise<DayCloseRecord> {
  return submitDayClose({ date: params.date, requestedBy: params.closedBy, note: params.note });
}
