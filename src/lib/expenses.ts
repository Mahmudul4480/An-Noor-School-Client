import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentActorLabel } from './actor';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { fetchAccounts, fetchEntries, isPettyCashAccount, recordCollection, recordExpense } from './ledger';
import { omitUndefined, toIsoString } from './utils';
import type { Expense } from '../types';

const EXPENSES_COLLECTION = 'expenses';
const LOCAL_EXPENSES_KEY = 'an-noor-expenses';

export const TRANSFER_CHARGE_CATEGORY = 'Bank / MFS Charge';

export const EXPENSE_CATEGORIES = [
  'Utility Bill',
  'Salary',
  'Maintenance',
  'Stationery',
  'Transport',
  'Marketing',
  'Event',
  TRANSFER_CHARGE_CATEGORY,
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

/** Voucher number for an approved expense; older records fall back to a stable derived one. */
export function expenseVoucherNumber(expense: Expense): string {
  if (expense.voucherNumber) return expense.voucherNumber;
  const datePart = (expense.date || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
  const seq = expense.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0');
  return `EXV-${datePart}-${seq}`;
}

function normalizeExpense(expense: Expense, documentId?: string): Expense {
  return {
    ...expense,
    id: expense.id || documentId || generateId('exp'),
    createdAt: toIsoString(expense.createdAt),
    date: toIsoString(expense.date, new Date().toISOString()).slice(0, 10),
    approvalStatus: expense.approvalStatus ?? 'approved',
  };
}

export async function fetchExpenses(): Promise<Expense[]> {
  if (isDemoLoginEnabled) {
    return readLocal<Expense[]>(LOCAL_EXPENSES_KEY, []).map((item) => normalizeExpense(item)).sort((a, b) => b.date.localeCompare(a.date));
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, EXPENSES_COLLECTION)));
  return snapshot.docs
    .map((document) => normalizeExpense(document.data() as Expense, document.id))
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

  await waitForAuthUser();
  await setDoc(doc(db, EXPENSES_COLLECTION, expense.id), omitUndefined({ ...expense, createdAt: serverTimestamp() }), {
    merge: true,
  });
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
    createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
    approvalStatus: 'pending',
  };

  await persistExpense(expense);

  const accounts = await fetchAccounts();
  const paidFrom = accounts.find((account) => account.id === expense.accountId);
  if (paidFrom && isPettyCashAccount(paidFrom)) {
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

/**
 * Cashout / bank charge on an internal transfer. The fee already left the source
 * account, so it is posted as an approved expense and debited from that account.
 */
export async function postTransferChargeExpense(input: {
  date: string;
  amount: number;
  accountId: string;
  fromAccountName: string;
  toAccountName: string;
  transferId: string;
  note?: string;
  createdBy?: string;
}): Promise<Expense> {
  if (!input.amount || input.amount <= 0) {
    throw new Error('Valid transfer charge দিন।');
  }

  const now = new Date().toISOString();
  const expense: Expense = {
    id: generateId('exp'),
    date: input.date,
    category: TRANSFER_CHARGE_CATEGORY,
    description: `Transfer charge — ${input.fromAccountName} → ${input.toAccountName}`,
    amount: input.amount,
    accountId: input.accountId,
    note: input.note?.trim() || `Internal transfer ${input.transferId}`,
    createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: now,
    approvalStatus: 'approved',
    reviewedBy: 'System (Internal Transfer)',
    reviewedAt: now,
    reviewNote: 'Posted with internal transfer cashout / bank charge.',
  };
  expense.voucherNumber = expenseVoucherNumber(expense);

  await persistExpense(expense);
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
    voucherNumber:
      params.action === 'approved'
        ? params.expense.voucherNumber ?? expenseVoucherNumber(params.expense)
        : params.expense.voucherNumber,
  };

  const entries = await fetchEntries();
  const alreadyPosted = entries.some(
    (entry) =>
      entry.relatedType === 'expense' &&
      entry.relatedId === updated.id &&
      entry.type === 'debit' &&
      !entry.reversed,
  );

  if (params.action === 'approved' && !alreadyPosted) {
    await recordExpense({
      accountId: updated.accountId,
      amount: updated.amount,
      reference: `Expense — ${updated.category}: ${updated.description}`,
      relatedId: updated.id,
      date: updated.date,
      note: updated.note,
    });
  }

  if (params.action === 'rejected' && alreadyPosted) {
    await recordCollection({
      accountId: updated.accountId,
      amount: updated.amount,
      reference: `Expense rejected — restore: ${updated.description}`,
      relatedId: updated.id,
      relatedType: 'expense',
      note: 'Principal rejected; petty cash overdraft reversed',
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
      voucherNumber: updated.voucherNumber ?? null,
    }),
  );

  return updated;
}
