import { collection, doc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled } from './auth';
import { recordExpense } from './ledger';
import { omitUndefined } from './utils';
import type { Expense } from '../types';

const EXPENSES_COLLECTION = 'expenses';
const LOCAL_EXPENSES_KEY = 'an-noor-expenses';

export const EXPENSE_CATEGORIES = [
  'Utility Bill',
  'Salary',
  'Maintenance',
  'Stationery',
  'Transport',
  'Marketing',
  'Event',
  'Other',
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

export async function fetchExpenses(): Promise<Expense[]> {
  if (isDemoLoginEnabled) {
    return readLocal<Expense[]>(LOCAL_EXPENSES_KEY, []).sort((a, b) => b.date.localeCompare(a.date));
  }

  const snapshot = await getDocs(query(collection(db, EXPENSES_COLLECTION)));
  return snapshot.docs.map((document) => document.data() as Expense).sort((a, b) => b.date.localeCompare(a.date));
}

export interface CreateExpenseInput {
  date: string;
  category: string;
  description: string;
  amount: number;
  accountId: string;
  note?: string;
  createdBy?: string;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const expense: Expense = {
    id: generateId('exp'),
    date: input.date,
    category: input.category,
    description: input.description,
    amount: input.amount,
    accountId: input.accountId,
    note: input.note,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };

  if (isDemoLoginEnabled) {
    const existing = readLocal<Expense[]>(LOCAL_EXPENSES_KEY, []);
    writeLocal(LOCAL_EXPENSES_KEY, [...existing, expense]);
  } else {
    await setDoc(
      doc(db, EXPENSES_COLLECTION, expense.id),
      omitUndefined({ ...expense, createdAt: serverTimestamp() }),
    );
  }

  await recordExpense({
    accountId: expense.accountId,
    amount: expense.amount,
    reference: `Expense — ${expense.category}: ${expense.description}`,
    relatedId: expense.id,
    date: expense.date,
    note: expense.note,
  });

  return expense;
}
