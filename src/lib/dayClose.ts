import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { computeAllBalances, fetchAccounts, fetchEntries } from './ledger';
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

export async function getDailySummary(date: string): Promise<Omit<DayCloseRecord, 'id' | 'closedBy' | 'closedAt' | 'note'>> {
  const [accounts, entries, expenses] = await Promise.all([
    fetchAccounts(),
    fetchEntries(),
    fetchExpenses(),
  ]);

  const todayEntries = entries.filter((entry) => isSameDay(entry.date, date));
  const todayExpenses = expenses.filter((expense) => isSameDay(expense.date, date));

  const totalIncome = sumEntries(todayEntries, 'credit');
  const totalExpense = sumEntries(todayEntries, 'debit') + todayExpenses.reduce((s, e) => s + e.amount, 0);
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

export async function isDayClosed(date: string): Promise<boolean> {
  if (isDemoLoginEnabled) {
    return readLocal<DayCloseRecord[]>(LOCAL_DAY_CLOSE_KEY, []).some((record) => record.date === date);
  }

  await waitForAuthUser();
  const snapshot = await getDocs(
    query(collection(db, DAY_CLOSE_COLLECTION), where('date', '==', date)),
  );
  return !snapshot.empty;
}

export async function closeDay(params: {
  date: string;
  closedBy: string;
  note?: string;
}): Promise<DayCloseRecord> {
  const alreadyClosed = await isDayClosed(params.date);
  if (alreadyClosed) throw new Error('This day is already closed.');

  const summary = await getDailySummary(params.date);
  const record: DayCloseRecord = {
    id: generateId('day'),
    ...summary,
    closedBy: params.closedBy,
    closedAt: new Date().toISOString(),
    note: params.note,
  };

  if (isDemoLoginEnabled) {
    const existing = readLocal<DayCloseRecord[]>(LOCAL_DAY_CLOSE_KEY, []);
    writeLocal(LOCAL_DAY_CLOSE_KEY, [...existing, record]);
    return record;
  }

  await waitForAuthUser();
  await setDoc(doc(db, DAY_CLOSE_COLLECTION, record.id), { ...record, closedAt: serverTimestamp() });
  return record;
}
