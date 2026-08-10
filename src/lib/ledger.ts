import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled } from './auth';
import type { LedgerAccount, LedgerAccountType, LedgerEntry } from '../types';

const ACCOUNTS_COLLECTION = 'ledgerAccounts';
const ENTRIES_COLLECTION = 'ledgerEntries';
const LOCAL_ACCOUNTS_KEY = 'an-noor-ledger-accounts';
const LOCAL_ENTRIES_KEY = 'an-noor-ledger-entries';

const DEFAULT_ACCOUNTS: LedgerAccount[] = [
  { id: 'main-cash', name: 'Main Cash', type: 'cash', openingBalance: 125400, createdAt: new Date().toISOString() },
  { id: 'petty-cash', name: 'Petty Cash', type: 'cash', openingBalance: 12500, createdAt: new Date().toISOString() },
  { id: 'city-bank', name: 'City Bank', type: 'bank', openingBalance: 1250000, createdAt: new Date().toISOString() },
  { id: 'bkash-merchant', name: 'bKash Merchant', type: 'mobile', openingBalance: 45600, createdAt: new Date().toISOString() },
  { id: 'nagad-business', name: 'Nagad Business', type: 'mobile', openingBalance: 28900, createdAt: new Date().toISOString() },
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
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

export async function fetchAccounts(): Promise<LedgerAccount[]> {
  if (isDemoLoginEnabled) {
    const accounts = readLocal<LedgerAccount[]>(LOCAL_ACCOUNTS_KEY, DEFAULT_ACCOUNTS);
    if (!localStorage.getItem(LOCAL_ACCOUNTS_KEY)) {
      writeLocal(LOCAL_ACCOUNTS_KEY, accounts);
    }
    return accounts;
  }

  const snapshot = await getDocs(query(collection(db, ACCOUNTS_COLLECTION)));
  return snapshot.docs.map((document) => document.data() as LedgerAccount);
}

export async function addAccount(input: { name: string; type: LedgerAccountType; openingBalance: number }): Promise<LedgerAccount> {
  const account: LedgerAccount = {
    id: generateId('acc'),
    name: input.name,
    type: input.type,
    openingBalance: input.openingBalance,
    createdAt: new Date().toISOString(),
  };

  if (isDemoLoginEnabled) {
    const accounts = readLocal<LedgerAccount[]>(LOCAL_ACCOUNTS_KEY, DEFAULT_ACCOUNTS);
    writeLocal(LOCAL_ACCOUNTS_KEY, [...accounts, account]);
    return account;
  }

  await setDoc(doc(db, ACCOUNTS_COLLECTION, account.id), { ...account, createdAt: serverTimestamp() });
  return account;
}

export async function fetchEntries(): Promise<LedgerEntry[]> {
  if (isDemoLoginEnabled) {
    return readLocal<LedgerEntry[]>(LOCAL_ENTRIES_KEY, []);
  }

  const snapshot = await getDocs(query(collection(db, ENTRIES_COLLECTION)));
  return snapshot.docs.map((document) => document.data() as LedgerEntry);
}

export async function addEntry(input: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
  const entry: LedgerEntry = {
    ...input,
    id: generateId('led'),
    createdAt: new Date().toISOString(),
  };

  if (isDemoLoginEnabled) {
    const entries = readLocal<LedgerEntry[]>(LOCAL_ENTRIES_KEY, []);
    writeLocal(LOCAL_ENTRIES_KEY, [...entries, entry]);
    return entry;
  }

  await addDoc(collection(db, ENTRIES_COLLECTION), { ...entry, createdAt: serverTimestamp() });
  return entry;
}

export async function recordCollection(params: {
  accountId: string;
  amount: number;
  reference: string;
  relatedId: string;
  date?: string;
}): Promise<LedgerEntry> {
  return addEntry({
    accountId: params.accountId,
    type: 'credit',
    amount: params.amount,
    reference: params.reference,
    relatedType: 'admission',
    relatedId: params.relatedId,
    date: params.date ?? new Date().toISOString(),
  });
}

export async function recordExpense(params: {
  accountId: string;
  amount: number;
  reference: string;
  relatedId: string;
  date?: string;
  note?: string;
}): Promise<LedgerEntry> {
  return addEntry({
    accountId: params.accountId,
    type: 'debit',
    amount: params.amount,
    reference: params.reference,
    relatedType: 'expense',
    relatedId: params.relatedId,
    date: params.date ?? new Date().toISOString(),
    note: params.note,
  });
}

export async function recordReversal(params: {
  accountId: string;
  amount: number;
  reference: string;
  relatedId: string;
  note?: string;
}): Promise<LedgerEntry> {
  return addEntry({
    accountId: params.accountId,
    type: 'debit',
    amount: params.amount,
    reference: params.reference,
    relatedType: 'admission',
    relatedId: params.relatedId,
    date: new Date().toISOString(),
    note: params.note,
  });
}

export async function transferBetweenAccounts(params: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
}): Promise<{ debit: LedgerEntry; credit: LedgerEntry }> {
  const transferId = generateId('xfer');
  const date = new Date().toISOString();

  const debit = await addEntry({
    accountId: params.fromAccountId,
    type: 'debit',
    amount: params.amount,
    reference: `Internal Transfer (Out) → ${params.toAccountId}`,
    relatedType: 'transfer',
    relatedId: transferId,
    date,
    note: params.note,
  });

  const credit = await addEntry({
    accountId: params.toAccountId,
    type: 'credit',
    amount: params.amount,
    reference: `Internal Transfer (In) ← ${params.fromAccountId}`,
    relatedType: 'transfer',
    relatedId: transferId,
    date,
    note: params.note,
  });

  return { debit, credit };
}

export function computeBalance(account: LedgerAccount, entries: LedgerEntry[]): number {
  const accountEntries = entries.filter((entry) => entry.accountId === account.id);
  const credits = accountEntries.filter((entry) => entry.type === 'credit').reduce((sum, entry) => sum + entry.amount, 0);
  const debits = accountEntries.filter((entry) => entry.type === 'debit').reduce((sum, entry) => sum + entry.amount, 0);
  return account.openingBalance + credits - debits;
}

export function computeAllBalances(accounts: LedgerAccount[], entries: LedgerEntry[]): { account: LedgerAccount; balance: number }[] {
  return accounts.map((account) => ({ account, balance: computeBalance(account, entries) }));
}
