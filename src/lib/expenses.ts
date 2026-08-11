import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled } from './auth';
import { recordExpense } from './ledger';
import { omitUndefined } from './utils';
import type { Expense } from '../types';

const EXPENSES_COLLECTION = 'expenses';
const LOCAL_EXPENSES_KEY = 'an-noor-expenses';

export const EXPENSE_APPROVAL_THRESHOLD = 5000;

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

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    approvalStatus: expense.approvalStatus ?? 'approved',
  };
}

export async function fetchExpenses(): Promise<Expense[]> {
  if (isDemoLoginEnabled) {
    return readLocal<Expense[]>(LOCAL_EXPENSES_KEY, []).map(normalizeExpense).sort((a, b) => b.date.localeCompare(a.date));
  }

  const snapshot = await getDocs(query(collection(db, EXPENSES_COLLECTION)));
  return snapshot.docs
    .map((document) => normalizeExpense(document.data() as Expense))
    .sort((a, b) => b.date.localeCompare(a.date));
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

async function persistExpense(expense: Expense): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocal<Expense[]>(LOCAL_EXPENSES_KEY, []);
    const index = existing.findIndex((item) => item.id === expense.id);
    if (index >= 0) existing[index] = expense;
    else existing.push(expense);
    writeLocal(LOCAL_EXPENSES_KEY, existing);
    return;
  }

  await setDoc(doc(db, EXPENSES_COLLECTION, expense.id), omitUndefined({ ...expense, createdAt: serverTimestamp() }), {
    merge: true,
  });
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const needsApproval = input.amount >= EXPENSE_APPROVAL_THRESHOLD;
  const expense: Expense = {
    id: generateId('exp'),
    date: input.date,
    category: input.category,
    description: input.description,
    amount: input.amount,
    accountId: input.accountId,
    note: input.note,
    createdBy: input.createdBy ?? 'Accounts Department',
    createdAt: new Date().toISOString(),
    approvalStatus: needsApproval ? 'pending' : 'approved',
  };

  await persistExpense(expense);

  if (!needsApproval) {
    await recordExpense({
      accountId: expense.accountId,
      amount: expense.amount,
      reference: `Expense — ${expense.category}: ${expense.description}`,
      relatedId: expense.id,
      date: expense.date,
      note: expense.note,
    });
  }

  return expense;
}

export async function reviewExpense(params: {
  expense: Expense;
  action: 'approved' | 'rejected';
  reviewedBy: string;
  note?: string;
}): Promise<Expense> {
  if (params.expense.approvalStatus !== 'pending') {
    throw new Error('This expense is not pending approval.');
  }

  const updated: Expense = {
    ...params.expense,
    approvalStatus: params.action,
    reviewedBy: params.reviewedBy,
    reviewedAt: new Date().toISOString(),
    reviewNote: params.note,
  };

  if (params.action === 'approved') {
    await recordExpense({
      accountId: updated.accountId,
      amount: updated.amount,
      reference: `Expense — ${updated.category}: ${updated.description}`,
      relatedId: updated.id,
      date: updated.date,
      note: updated.note,
    });
  }

  if (isDemoLoginEnabled) {
    await persistExpense(updated);
    return updated;
  }

  await updateDoc(
    doc(db, EXPENSES_COLLECTION, updated.id),
    omitUndefined({
      approvalStatus: updated.approvalStatus,
      reviewedBy: updated.reviewedBy,
      reviewedAt: serverTimestamp(),
      reviewNote: updated.reviewNote ?? null,
    }),
  );

  return updated;
}
