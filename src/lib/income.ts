import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentActorLabel } from './actor';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { recordCollection } from './ledger';
import { omitUndefined, toIsoString } from './utils';
import type { IncomeEntry } from '../types';

const INCOME_COLLECTION = 'incomeEntries';
const LOCAL_INCOME_KEY = 'an-noor-income-entries';

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

export function incomeReceiptNumber(date: string): string {
  const datePart = (date || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
  const seq = String(Date.now()).slice(-4);
  return `INC-${datePart}-${seq}`;
}

function normalizeIncome(entry: IncomeEntry, documentId?: string): IncomeEntry {
  const id = entry.id || documentId || generateId('inc');
  const date = toIsoString(entry.date, new Date().toISOString()).slice(0, 10);
  return {
    ...entry,
    id,
    date,
    amount: Number(entry.amount) || 0,
    receiptNumber: entry.receiptNumber || incomeReceiptNumber(date),
    createdAt: toIsoString(entry.createdAt),
    reviewedAt: entry.reviewedAt ? toIsoString(entry.reviewedAt) : undefined,
    approvalStatus: entry.approvalStatus ?? 'pending',
  };
}

export async function fetchIncomeEntries(): Promise<IncomeEntry[]> {
  if (isDemoLoginEnabled) {
    return readLocal<IncomeEntry[]>(LOCAL_INCOME_KEY, [])
      .map((item) => normalizeIncome(item))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, INCOME_COLLECTION)));
  return snapshot.docs
    .map((document) => normalizeIncome(document.data() as IncomeEntry, document.id))
    .sort((a, b) => b.date.localeCompare(a.date));
}

async function persistIncome(entry: IncomeEntry): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocal<IncomeEntry[]>(LOCAL_INCOME_KEY, []);
    const index = existing.findIndex((item) => item.id === entry.id);
    if (index >= 0) existing[index] = entry;
    else existing.push(entry);
    writeLocal(LOCAL_INCOME_KEY, existing);
    return;
  }

  await waitForAuthUser();
  await setDoc(
    doc(db, INCOME_COLLECTION, entry.id),
    omitUndefined({ ...entry, createdAt: serverTimestamp() }),
    { merge: true },
  );
}

export interface CreateIncomeInput {
  date: string;
  category: string;
  source: string;
  description: string;
  amount: number;
  accountId: string;
  paymentMethod?: IncomeEntry['paymentMethod'];
  reference?: string;
  note?: string;
  createdBy?: string;
}

export async function createIncomeEntry(input: CreateIncomeInput): Promise<IncomeEntry> {
  if (!input.category) throw new Error('Income category select করুন।');
  if (!input.source.trim()) throw new Error('Received from কার কাছ থেকে এসেছে লিখুন।');
  if (!input.description.trim()) throw new Error('Description লিখুন।');
  if (!input.amount || input.amount <= 0) throw new Error('Valid amount দিন।');
  if (!input.accountId) throw new Error('Receiving account select করুন।');

  const date = input.date || new Date().toISOString().slice(0, 10);
  const entry: IncomeEntry = normalizeIncome({
    id: generateId('inc'),
    receiptNumber: incomeReceiptNumber(date),
    date,
    category: input.category,
    source: input.source.trim(),
    description: input.description.trim(),
    amount: input.amount,
    accountId: input.accountId,
    paymentMethod: input.paymentMethod ?? 'cash',
    reference: input.reference?.trim() || undefined,
    note: input.note?.trim() || undefined,
    createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
    approvalStatus: 'pending',
  });

  await persistIncome(entry);
  return entry;
}

/** Principal decision. On approval the amount is credited to the selected account. */
export async function reviewIncomeEntry(params: {
  entry: IncomeEntry;
  action: 'approved' | 'rejected';
  reviewedBy: string;
  note?: string;
}): Promise<IncomeEntry> {
  if (params.entry.approvalStatus !== 'pending') {
    throw new Error('This income entry is not pending approval.');
  }

  const updated: IncomeEntry = {
    ...params.entry,
    approvalStatus: params.action,
    reviewedBy: params.reviewedBy,
    reviewedAt: new Date().toISOString(),
    reviewNote: params.note,
  };

  if (params.action === 'approved') {
    await recordCollection({
      accountId: updated.accountId,
      amount: updated.amount,
      reference: `Income — ${updated.category}: ${updated.description}`,
      relatedId: updated.id,
      relatedType: 'income',
      date: updated.date,
      note: updated.reference ? `Ref: ${updated.reference}` : updated.note,
    });
  }

  if (isDemoLoginEnabled) {
    await persistIncome(updated);
    return updated;
  }

  await waitForAuthUser();
  await updateDoc(
    doc(db, INCOME_COLLECTION, updated.id),
    omitUndefined({
      approvalStatus: updated.approvalStatus,
      reviewedBy: updated.reviewedBy,
      reviewedAt: serverTimestamp(),
      reviewNote: updated.reviewNote ?? null,
    }),
  );

  return updated;
}

export function computeIncomeStats(entries: IncomeEntry[]) {
  const approved = entries.filter((entry) => entry.approvalStatus === 'approved');
  const pending = entries.filter((entry) => entry.approvalStatus === 'pending');
  const month = new Date().toISOString().slice(0, 7);

  return {
    approvedTotal: approved.reduce((sum, entry) => sum + entry.amount, 0),
    pendingTotal: pending.reduce((sum, entry) => sum + entry.amount, 0),
    pendingCount: pending.length,
    monthTotal: approved
      .filter((entry) => entry.date.startsWith(month))
      .reduce((sum, entry) => sum + entry.amount, 0),
  };
}
