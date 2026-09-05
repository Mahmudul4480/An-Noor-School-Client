import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentActorLabel } from './actor';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { omitUndefined, toIsoString } from './utils';
import type { InvoiceItemCategory } from '../types';

const ITEM_CATALOG_COLLECTION = 'invoiceItemCategories';
const LOCAL_ITEM_CATALOG_KEY = 'an-noor-invoice-item-categories';

/**
 * Everything a school bills outside monthly tuition. These always exist; Accounts
 * can change the default amount or add their own on top.
 */
export const BUILT_IN_INVOICE_ITEMS: { id: string; label: string; defaultAmount: number }[] = [
  { id: 'examFee', label: 'Exam Fee', defaultAmount: 1200 },
  { id: 'bookFee', label: 'Book / Boi', defaultAmount: 0 },
  { id: 'notebookFee', label: 'Khata / Notebook', defaultAmount: 0 },
  { id: 'dressFee', label: 'School Dress', defaultAmount: 0 },
  { id: 'stationeryFee', label: 'Stationery', defaultAmount: 0 },
  { id: 'idCardFee', label: 'ID Card', defaultAmount: 150 },
  { id: 'busFee', label: 'Bus / Transport Fee', defaultAmount: 1500 },
  { id: 'sportsFee', label: 'Sports Charge', defaultAmount: 800 },
  { id: 'tiffinFee', label: 'Tiffin / Meal', defaultAmount: 0 },
  { id: 'eventFee', label: 'Event / Picnic', defaultAmount: 0 },
  { id: 'certificateFee', label: 'Certificate / Testimonial', defaultAmount: 200 },
  { id: 'lateFee', label: 'Late Fine', defaultAmount: 0 },
  { id: 'utilityBill', label: 'Utility Bill Share', defaultAmount: 500 },
  { id: 'other', label: 'Other Fee', defaultAmount: 0 },
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

/** Slug used as the document id, so the same label is never stored twice. */
export function invoiceItemId(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `item-${Date.now()}`;
}

function normalizeItem(data: InvoiceItemCategory): InvoiceItemCategory {
  return {
    ...data,
    id: data.id,
    label: String(data.label ?? '').trim(),
    defaultAmount: Number(data.defaultAmount) || 0,
    archived: data.archived === true,
    createdAt: toIsoString(data.createdAt),
  };
}

async function fetchStoredItems(): Promise<InvoiceItemCategory[]> {
  if (isDemoLoginEnabled) {
    return readLocal<InvoiceItemCategory[]>(LOCAL_ITEM_CATALOG_KEY, []).map(normalizeItem);
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, ITEM_CATALOG_COLLECTION)));
  return snapshot.docs.map((document) =>
    normalizeItem({ ...(document.data() as InvoiceItemCategory), id: document.id }),
  );
}

/**
 * Built-in items merged with the stored ones. A stored row with a built-in id acts as
 * an override, so editing "Exam Fee" changes the amount instead of adding a duplicate.
 */
export async function fetchInvoiceItemCategories(options?: {
  includeArchived?: boolean;
}): Promise<InvoiceItemCategory[]> {
  const stored = await fetchStoredItems();
  const byId = new Map<string, InvoiceItemCategory>();

  for (const item of BUILT_IN_INVOICE_ITEMS) {
    byId.set(item.id, {
      id: item.id,
      label: item.label,
      defaultAmount: item.defaultAmount,
      builtIn: true,
      archived: false,
      createdAt: '',
    });
  }

  for (const item of stored) {
    const existing = byId.get(item.id);
    byId.set(item.id, { ...item, builtIn: existing?.builtIn ?? false });
  }

  return [...byId.values()]
    .filter((item) => options?.includeArchived || !item.archived)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function saveInvoiceItemCategory(input: {
  id?: string;
  label: string;
  defaultAmount: number;
  createdBy?: string;
}): Promise<InvoiceItemCategory> {
  const label = input.label.trim();
  if (!label) throw new Error('Item name is required.');
  if (!Number.isFinite(input.defaultAmount) || input.defaultAmount < 0) {
    throw new Error('Default amount cannot be negative.');
  }

  const id = input.id ?? invoiceItemId(label);
  const builtIn = BUILT_IN_INVOICE_ITEMS.some((item) => item.id === id);

  if (!input.id) {
    const existing = await fetchInvoiceItemCategories({ includeArchived: true });
    if (existing.some((item) => item.id === id)) {
      throw new Error('This invoice item already exists.');
    }
  }

  const item: InvoiceItemCategory = {
    id,
    label,
    defaultAmount: input.defaultAmount,
    builtIn,
    archived: false,
    createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
  };

  if (isDemoLoginEnabled) {
    const all = readLocal<InvoiceItemCategory[]>(LOCAL_ITEM_CATALOG_KEY, []);
    const index = all.findIndex((entry) => entry.id === id);
    if (index >= 0) all[index] = { ...all[index], ...item, createdAt: all[index].createdAt || item.createdAt };
    else all.push(item);
    writeLocal(LOCAL_ITEM_CATALOG_KEY, all);
    return item;
  }

  await waitForAuthUser();
  await setDoc(
    doc(db, ITEM_CATALOG_COLLECTION, id),
    omitUndefined({ ...item, createdAt: serverTimestamp() }),
    { merge: true },
  );
  return item;
}

/** Built-in items are archived (hidden) rather than deleted so old invoices still read fine. */
export async function removeInvoiceItemCategory(item: InvoiceItemCategory): Promise<void> {
  if (isDemoLoginEnabled) {
    const all = readLocal<InvoiceItemCategory[]>(LOCAL_ITEM_CATALOG_KEY, []);
    if (item.builtIn) {
      const index = all.findIndex((entry) => entry.id === item.id);
      const archived = { ...item, archived: true };
      if (index >= 0) all[index] = archived;
      else all.push(archived);
      writeLocal(LOCAL_ITEM_CATALOG_KEY, all);
      return;
    }
    writeLocal(
      LOCAL_ITEM_CATALOG_KEY,
      all.filter((entry) => entry.id !== item.id),
    );
    return;
  }

  await waitForAuthUser();
  if (item.builtIn) {
    await setDoc(
      doc(db, ITEM_CATALOG_COLLECTION, item.id),
      omitUndefined({ ...item, archived: true, createdAt: serverTimestamp() }),
      { merge: true },
    );
    return;
  }
  await deleteDoc(doc(db, ITEM_CATALOG_COLLECTION, item.id));
}

export async function restoreInvoiceItemCategory(item: InvoiceItemCategory): Promise<void> {
  if (isDemoLoginEnabled) {
    const all = readLocal<InvoiceItemCategory[]>(LOCAL_ITEM_CATALOG_KEY, []);
    const index = all.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      all[index] = { ...all[index], archived: false };
      writeLocal(LOCAL_ITEM_CATALOG_KEY, all);
    }
    return;
  }

  await waitForAuthUser();
  await setDoc(doc(db, ITEM_CATALOG_COLLECTION, item.id), { archived: false }, { merge: true });
}
