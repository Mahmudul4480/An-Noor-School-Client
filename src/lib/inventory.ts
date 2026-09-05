import { collection, doc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentActorLabel } from './actor';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { createExpense } from './expenses';
import { recordCollection } from './ledger';
import { omitUndefined, toIsoString } from './utils';
import type {
  InventoryBuyerType,
  InventoryFifoSlice,
  InventoryItem,
  InventoryLot,
  InventoryMovement,
  InventoryPurpose,
  InventoryStockAlert,
} from '../types';

const ITEMS_COLLECTION = 'inventoryItems';
const MOVEMENTS_COLLECTION = 'inventoryMovements';
const LOTS_COLLECTION = 'inventoryLots';
const LOCAL_ITEMS_KEY = 'an-noor-inventory-items';
const LOCAL_MOVEMENTS_KEY = 'an-noor-inventory-movements';
const LOCAL_LOTS_KEY = 'an-noor-inventory-lots';

/** Class groupings used on the copy stock summary sheet. */
export const INVENTORY_CLASS_OPTIONS = [
  'All',
  'Play',
  'Nursery',
  'KG',
  'KG to V',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
];

export const INVENTORY_UNIT_OPTIONS = ['pcs', 'copy', 'set', 'packet', 'ream', 'box', 'dozen'];

export const INVENTORY_PURPOSE_OPTIONS: { id: InventoryPurpose; label: string; hint: string }[] = [
  { id: 'student', label: 'For Student', hint: 'Shop / sale to students' },
  { id: 'school', label: 'For School', hint: 'Office, class, cleaning — school use' },
];

export function itemPurpose(item: Pick<InventoryItem, 'purpose'>): InventoryPurpose {
  return item.purpose === 'school' ? 'school' : 'student';
}

export function purposeLabel(purpose?: InventoryPurpose): string {
  return purpose === 'school' ? 'For School' : 'For Student';
}

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

function normalizeItem(data: InventoryItem, documentId?: string): InventoryItem {
  const costRate = Number(data.costRate) || 0;
  return {
    ...data,
    id: data.id || documentId || generateId('itm'),
    name: String(data.name ?? '').trim(),
    purpose: data.purpose === 'school' ? 'school' : 'student',
    className: data.className || 'All',
    unit: data.unit || 'pcs',
    costRate,
    studentPrice: Number(data.studentPrice) || costRate,
    purchasedQty: Number(data.purchasedQty) || 0,
    soldQty: Number(data.soldQty) || 0,
    lowStockThreshold: Number(data.lowStockThreshold) || 0,
    archived: data.archived === true,
    createdAt: toIsoString(data.createdAt),
    updatedAt: data.updatedAt ? toIsoString(data.updatedAt) : undefined,
  };
}

function normalizeMovement(data: InventoryMovement, documentId?: string): InventoryMovement {
  return {
    ...data,
    id: data.id || documentId || generateId('mov'),
    quantity: Number(data.quantity) || 0,
    unitPrice: Number(data.unitPrice) || 0,
    totalAmount: Number(data.totalAmount) || 0,
    date: toIsoString(data.date, new Date().toISOString()).slice(0, 10),
    createdAt: toIsoString(data.createdAt),
    fifoSlices: data.fifoSlices?.map((slice) => ({
      ...slice,
      quantity: Number(slice.quantity) || 0,
      unitCost: Number(slice.unitCost) || 0,
    })),
  };
}

function normalizeLot(data: InventoryLot, documentId?: string): InventoryLot {
  return {
    ...data,
    id: data.id || documentId || generateId('lot'),
    quantity: Number(data.quantity) || 0,
    remainingQty: Number(data.remainingQty) || 0,
    unitCost: Number(data.unitCost) || 0,
    receivedDate: toIsoString(data.receivedDate, new Date().toISOString()).slice(0, 10),
    createdAt: toIsoString(data.createdAt),
  };
}

export function remainingStock(item: InventoryItem): number {
  return Math.max(0, item.purchasedQty - item.soldQty);
}

export function sortLotsFifo(lots: InventoryLot[]): InventoryLot[] {
  return [...lots].sort((a, b) => {
    const byDate = a.receivedDate.localeCompare(b.receivedDate);
    return byDate !== 0 ? byDate : a.createdAt.localeCompare(b.createdAt);
  });
}

export function openLots(lots: InventoryLot[]): InventoryLot[] {
  return sortLotsFifo(lots.filter((lot) => lot.remainingQty > 0));
}

export function fifoStockValue(lots: InventoryLot[]): number {
  return openLots(lots).reduce((sum, lot) => sum + lot.remainingQty * lot.unitCost, 0);
}

export function stockValue(item: InventoryItem, lots?: InventoryLot[]): number {
  const itemLots = lots?.filter((lot) => lot.itemId === item.id);
  if (itemLots && itemLots.some((lot) => lot.remainingQty > 0)) {
    return fifoStockValue(itemLots);
  }
  return remainingStock(item) * item.costRate;
}

/** Preview which oldest lots a sale of `quantity` would take. */
export function previewFifoConsumption(lots: InventoryLot[], quantity: number): InventoryFifoSlice[] {
  let need = Math.floor(quantity);
  const slices: InventoryFifoSlice[] = [];
  for (const lot of openLots(lots)) {
    if (need <= 0) break;
    const take = Math.min(lot.remainingQty, need);
    slices.push({
      lotId: lot.id,
      lotDate: lot.receivedDate,
      quantity: take,
      unitCost: lot.unitCost,
    });
    need -= take;
  }
  return slices;
}

export function fifoCostTotal(slices: InventoryFifoSlice[]): number {
  return Math.round(slices.reduce((sum, slice) => sum + slice.quantity * slice.unitCost, 0) * 100) / 100;
}

/** Price a given buyer pays: students a bit above cost, staff exactly at cost. */
export function priceForBuyer(item: InventoryItem, buyerType: InventoryBuyerType): number {
  return buyerType === 'student' ? item.studentPrice : item.costRate;
}

export async function fetchInventoryItems(options?: { includeArchived?: boolean }): Promise<InventoryItem[]> {
  let items: InventoryItem[];

  if (isDemoLoginEnabled) {
    items = readLocal<InventoryItem[]>(LOCAL_ITEMS_KEY, []).map((item) => normalizeItem(item));
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, ITEMS_COLLECTION)));
    items = snapshot.docs.map((document) => normalizeItem(document.data() as InventoryItem, document.id));
  }

  return items
    .filter((item) => options?.includeArchived || !item.archived)
    .sort((a, b) => {
      const byPurpose = itemPurpose(a).localeCompare(itemPurpose(b));
      return byPurpose !== 0 ? byPurpose : a.name.localeCompare(b.name);
    });
}

export async function fetchInventoryMovements(itemId?: string): Promise<InventoryMovement[]> {
  let movements: InventoryMovement[];

  if (isDemoLoginEnabled) {
    movements = readLocal<InventoryMovement[]>(LOCAL_MOVEMENTS_KEY, []).map((item) => normalizeMovement(item));
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, MOVEMENTS_COLLECTION)));
    movements = snapshot.docs.map((document) =>
      normalizeMovement(document.data() as InventoryMovement, document.id),
    );
  }

  return movements
    .filter((movement) => !itemId || movement.itemId === itemId)
    .sort((a, b) => toIsoString(b.createdAt).localeCompare(toIsoString(a.createdAt)));
}

async function persistItem(item: InventoryItem): Promise<void> {
  if (isDemoLoginEnabled) {
    const all = readLocal<InventoryItem[]>(LOCAL_ITEMS_KEY, []);
    const index = all.findIndex((entry) => entry.id === item.id);
    if (index >= 0) all[index] = item;
    else all.push(item);
    writeLocal(LOCAL_ITEMS_KEY, all);
    return;
  }

  await waitForAuthUser();
  await setDoc(doc(db, ITEMS_COLLECTION, item.id), omitUndefined({ ...item }), { merge: true });
}

async function persistMovement(movement: InventoryMovement): Promise<void> {
  if (isDemoLoginEnabled) {
    const all = readLocal<InventoryMovement[]>(LOCAL_MOVEMENTS_KEY, []);
    all.push(movement);
    writeLocal(LOCAL_MOVEMENTS_KEY, all);
    return;
  }

  await waitForAuthUser();
  await setDoc(
    doc(db, MOVEMENTS_COLLECTION, movement.id),
    omitUndefined({ ...movement, createdAt: serverTimestamp() }),
  );
}

async function persistLot(lot: InventoryLot): Promise<void> {
  if (isDemoLoginEnabled) {
    const all = readLocal<InventoryLot[]>(LOCAL_LOTS_KEY, []);
    const index = all.findIndex((entry) => entry.id === lot.id);
    if (index >= 0) all[index] = lot;
    else all.push(lot);
    writeLocal(LOCAL_LOTS_KEY, all);
    return;
  }

  await waitForAuthUser();
  await setDoc(doc(db, LOTS_COLLECTION, lot.id), omitUndefined({ ...lot }), { merge: true });
}

export async function fetchInventoryLots(itemId?: string): Promise<InventoryLot[]> {
  let lots: InventoryLot[];

  if (isDemoLoginEnabled) {
    lots = readLocal<InventoryLot[]>(LOCAL_LOTS_KEY, []).map((item) => normalizeLot(item));
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, LOTS_COLLECTION)));
    lots = snapshot.docs.map((document) => normalizeLot(document.data() as InventoryLot, document.id));
  }

  return sortLotsFifo(lots.filter((lot) => !itemId || lot.itemId === itemId));
}

function buildLot(input: {
  item: InventoryItem;
  quantity: number;
  unitCost: number;
  receivedDate: string;
  note?: string;
  createdBy?: string;
}): InventoryLot {
  return normalizeLot({
    id: generateId('lot'),
    itemId: input.item.id,
    itemName: input.item.name,
    receivedDate: input.receivedDate,
    quantity: input.quantity,
    remainingQty: input.quantity,
    unitCost: input.unitCost,
    note: input.note,
    createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
  });
}

/** Existing stock without lots becomes one opening lot so FIFO can start. */
async function ensureLegacyLots(item: InventoryItem): Promise<InventoryLot[]> {
  const lots = await fetchInventoryLots(item.id);
  const remaining = remainingStock(item);
  const lotRemaining = lots.reduce((sum, lot) => sum + lot.remainingQty, 0);
  if (remaining > 0 && lotRemaining === 0) {
    const lot = buildLot({
      item,
      quantity: remaining,
      unitCost: item.costRate,
      receivedDate: (item.createdAt || new Date().toISOString()).slice(0, 10),
      note: 'Opening / legacy stock',
      createdBy: item.createdBy,
    });
    await persistLot(lot);
    return [lot];
  }
  return lots;
}

async function consumeFifoLots(item: InventoryItem, quantity: number): Promise<InventoryFifoSlice[]> {
  const lots = await ensureLegacyLots(item);
  const slices = previewFifoConsumption(lots, quantity);
  const taken = slices.reduce((sum, slice) => sum + slice.quantity, 0);
  if (taken < quantity) {
    throw new Error(`FIFO stock-এ মাত্র ${taken} ${item.unit} আছে।`);
  }

  for (const slice of slices) {
    const lot = lots.find((entry) => entry.id === slice.lotId);
    if (!lot) continue;
    lot.remainingQty = Math.max(0, lot.remainingQty - slice.quantity);
    await persistLot(lot);
  }

  return slices;
}

export interface SaveInventoryItemInput {
  id?: string;
  name: string;
  purpose: InventoryPurpose;
  className: string;
  unit: string;
  costRate: number;
  studentPrice: number;
  /** Opening stock; only used when creating a new item */
  openingQty?: number;
  lowStockThreshold: number;
  note?: string;
  createdBy?: string;
}

export async function saveInventoryItem(input: SaveInventoryItemInput): Promise<InventoryItem> {
  const name = input.name.trim();
  if (!name) throw new Error('Item name is required.');
  if (input.costRate < 0 || input.studentPrice < 0) throw new Error('Rate cannot be negative.');
  if (input.purpose === 'student' && input.studentPrice < input.costRate) {
    throw new Error('Student price cost rate-এর চেয়ে কম হতে পারে না।');
  }

  const items = await fetchInventoryItems({ includeArchived: true });

  if (input.id) {
    const existing = items.find((item) => item.id === input.id);
    if (!existing) throw new Error('Item not found.');
    const updated = normalizeItem({
      ...existing,
      name,
      purpose: input.purpose,
      className: input.className,
      unit: input.unit,
      costRate: input.costRate,
      studentPrice: input.purpose === 'school' ? input.costRate : input.studentPrice,
      lowStockThreshold: input.lowStockThreshold,
      note: input.note?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    await persistItem(updated);
    return updated;
  }

  if (
    items.some(
      (item) =>
        item.name.toLowerCase() === name.toLowerCase() &&
        item.className === input.className &&
        itemPurpose(item) === input.purpose,
    )
  ) {
    throw new Error('এই store ও class-এ একই নামের item আগেই আছে।');
  }

  const openingQty = Math.max(0, Math.floor(input.openingQty ?? 0));
  const item = normalizeItem({
    id: generateId('itm'),
    name,
    purpose: input.purpose,
    className: input.className,
    unit: input.unit,
    costRate: input.costRate,
    studentPrice: input.purpose === 'school' ? input.costRate : input.studentPrice,
    purchasedQty: openingQty,
    soldQty: 0,
    lowStockThreshold: input.lowStockThreshold,
    note: input.note?.trim() || undefined,
    archived: false,
    createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
  });

  await persistItem(item);

  if (openingQty > 0) {
    const openingDate = new Date().toISOString().slice(0, 10);
    await persistLot(
      buildLot({
        item,
        quantity: openingQty,
        unitCost: item.costRate,
        receivedDate: openingDate,
        note: 'Opening stock',
        createdBy: item.createdBy,
      }),
    );
    await persistMovement(
      normalizeMovement({
        id: generateId('mov'),
        itemId: item.id,
        itemName: item.name,
        type: 'adjustment',
        quantity: openingQty,
        unitPrice: item.costRate,
        totalAmount: openingQty * item.costRate,
        date: openingDate,
        note: 'Opening stock (FIFO lot)',
        createdBy: item.createdBy,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  return item;
}

export async function archiveInventoryItem(item: InventoryItem): Promise<void> {
  await persistItem(normalizeItem({ ...item, archived: true, updatedAt: new Date().toISOString() }));
}

export async function restoreInventoryItem(item: InventoryItem): Promise<void> {
  await persistItem(normalizeItem({ ...item, archived: false, updatedAt: new Date().toISOString() }));
}

export interface RestockInput {
  itemId: string;
  quantity: number;
  /** Purchase rate for this lot; updates the item's cost rate when given */
  unitCost?: number;
  date?: string;
  note?: string;
  /** Book the purchase as an expense in the ledger (needs Principal approval) */
  recordAsExpense?: boolean;
  accountId?: string;
  createdBy?: string;
}

/**
 * Adds a purchased lot to stock. When `recordAsExpense` is set the money side is
 * posted as an expense so the ledger stays in step with the store.
 */
export async function restockInventoryItem(input: RestockInput): Promise<InventoryItem> {
  const quantity = Math.floor(input.quantity);
  if (!quantity || quantity <= 0) throw new Error('Valid quantity দিন।');

  const items = await fetchInventoryItems({ includeArchived: true });
  const item = items.find((entry) => entry.id === input.itemId);
  if (!item) throw new Error('Item not found.');
  await ensureLegacyLots(item);

  const unitCost = input.unitCost && input.unitCost > 0 ? input.unitCost : item.costRate;
  const date = input.date || new Date().toISOString().slice(0, 10);
  const totalAmount = quantity * unitCost;

  if (input.recordAsExpense) {
    if (!input.accountId) throw new Error('Expense record করতে account select করুন।');
    await createExpense({
      date,
      category: 'Stationery',
      description: `Stock purchase — ${item.name} (${quantity} ${item.unit})`,
      amount: totalAmount,
      accountId: input.accountId,
      note: input.note,
      createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    });
  }

  const updated = normalizeItem({
    ...item,
    purchasedQty: item.purchasedQty + quantity,
    costRate: unitCost,
    studentPrice: Math.max(item.studentPrice, unitCost),
    updatedAt: new Date().toISOString(),
  });

  await persistItem(updated);
  await persistLot(
    buildLot({
      item: updated,
      quantity,
      unitCost,
      receivedDate: date,
      note: input.note?.trim() || undefined,
      createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    }),
  );
  await persistMovement(
    normalizeMovement({
      id: generateId('mov'),
      itemId: item.id,
      itemName: item.name,
      type: 'purchase',
      quantity,
      unitPrice: unitCost,
      totalAmount,
      accountId: input.recordAsExpense ? input.accountId : undefined,
      date,
      note: input.note?.trim() || `FIFO lot ${date}`,
      createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
      createdAt: new Date().toISOString(),
    }),
  );

  return updated;
}

export interface InventorySaleInput {
  itemId: string;
  quantity: number;
  buyerType: InventoryBuyerType;
  buyerName: string;
  studentId?: string;
  className?: string;
  accountId: string;
  date?: string;
  note?: string;
  createdBy?: string;
}

export interface InventorySaleResult {
  item: InventoryItem;
  movement: InventoryMovement;
}

/**
 * Sells stock over the counter. Students pay the student price, staff pay cost.
 * The collected amount is credited to the selected account straight away.
 */
export async function recordInventorySale(input: InventorySaleInput): Promise<InventorySaleResult> {
  const quantity = Math.floor(input.quantity);
  if (!quantity || quantity <= 0) throw new Error('Valid quantity দিন।');
  if (!input.buyerName.trim()) throw new Error('Buyer name লিখুন।');
  if (!input.accountId) throw new Error('Receiving account select করুন।');

  const items = await fetchInventoryItems({ includeArchived: true });
  const item = items.find((entry) => entry.id === input.itemId);
  if (!item) throw new Error('Item not found.');
  if (itemPurpose(item) === 'school') {
    throw new Error('For School item বিক্রি হয় না। Issue to school ব্যবহার করুন।');
  }

  const available = remainingStock(item);
  if (quantity > available) {
    throw new Error(`Stock-এ মাত্র ${available} ${item.unit} আছে।`);
  }

  const fifoSlices = await consumeFifoLots(item, quantity);
  const fifoCost = fifoCostTotal(fifoSlices);
  const unitPrice =
    input.buyerType === 'staff'
      ? quantity > 0
        ? Math.round((fifoCost / quantity) * 100) / 100
        : 0
      : item.studentPrice;
  const totalAmount = Math.round(quantity * unitPrice * 100) / 100;
  const date = input.date || new Date().toISOString().slice(0, 10);
  const fifoNote = fifoSlices.map((slice) => `${slice.lotDate}×${slice.quantity}@${slice.unitCost}`).join(', ');

  const movement = normalizeMovement({
    id: generateId('mov'),
    itemId: item.id,
    itemName: item.name,
    type: 'sale',
    quantity,
    unitPrice,
    totalAmount,
    buyerType: input.buyerType,
    buyerName: input.buyerName.trim(),
    studentId: input.studentId || undefined,
    className: input.className || undefined,
    accountId: input.accountId,
    date,
    note: [input.note?.trim(), `FIFO: ${fifoNote}`].filter(Boolean).join(' • ') || undefined,
    createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
    fifoSlices,
  });

  const updated = normalizeItem({
    ...item,
    soldQty: item.soldQty + quantity,
    updatedAt: new Date().toISOString(),
  });

  await persistItem(updated);
  await persistMovement(movement);

  if (totalAmount > 0) {
    await recordCollection({
      accountId: input.accountId,
      amount: totalAmount,
      reference: `Store Sale — ${item.name} × ${quantity} (${input.buyerName.trim()})`,
      relatedId: movement.id,
      relatedType: 'inventory',
      date,
      note:
        input.buyerType === 'staff'
          ? `Staff purchase at FIFO cost • ${fifoNote}`
          : input.studentId
            ? `Student ID: ${input.studentId}`
            : `FIFO: ${fifoNote}`,
    });
  }

  return { item: updated, movement };
}

export interface InventoryIssueInput {
  itemId: string;
  quantity: number;
  issuedTo: string;
  date?: string;
  note?: string;
  createdBy?: string;
}

/** Take For School stock off the shelf for office / class use. No money comes in. */
export async function issueInventoryStock(input: InventoryIssueInput): Promise<InventorySaleResult> {
  const quantity = Math.floor(input.quantity);
  if (!quantity || quantity <= 0) throw new Error('Valid quantity দিন।');
  if (!input.issuedTo.trim()) throw new Error('কাদের জন্য issue হচ্ছে লিখুন।');

  const items = await fetchInventoryItems({ includeArchived: true });
  const item = items.find((entry) => entry.id === input.itemId);
  if (!item) throw new Error('Item not found.');
  if (itemPurpose(item) !== 'school') {
    throw new Error('Issue শুধু For School store-এর জন্য। Student shop item বিক্রি করুন।');
  }
  if (quantity > remainingStock(item)) {
    throw new Error(`Stock-এ মাত্র ${remainingStock(item)} ${item.unit} আছে।`);
  }

  const fifoSlices = await consumeFifoLots(item, quantity);
  const fifoCost = fifoCostTotal(fifoSlices);
  const date = input.date || new Date().toISOString().slice(0, 10);
  const fifoNote = fifoSlices.map((slice) => `${slice.lotDate}×${slice.quantity}@${slice.unitCost}`).join(', ');

  const movement = normalizeMovement({
    id: generateId('mov'),
    itemId: item.id,
    itemName: item.name,
    type: 'issue',
    quantity,
    unitPrice: quantity > 0 ? Math.round((fifoCost / quantity) * 100) / 100 : 0,
    totalAmount: fifoCost,
    buyerName: input.issuedTo.trim(),
    date,
    note: [input.note?.trim(), `School use • FIFO: ${fifoNote}`].filter(Boolean).join(' • ') || undefined,
    createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
    fifoSlices,
  });

  const updated = normalizeItem({
    ...item,
    soldQty: item.soldQty + quantity,
    updatedAt: new Date().toISOString(),
  });

  await persistItem(updated);
  await persistMovement(movement);
  return { item: updated, movement };
}

/** Write off damaged or lost stock without touching the ledger. */
export async function adjustInventoryStock(input: {
  itemId: string;
  quantity: number;
  reason: string;
  createdBy?: string;
}): Promise<InventoryItem> {
  const quantity = Math.floor(input.quantity);
  if (!quantity || quantity === 0) throw new Error('Valid quantity দিন।');
  if (!input.reason.trim()) throw new Error('Adjustment-এর reason লিখুন।');

  const items = await fetchInventoryItems({ includeArchived: true });
  const item = items.find((entry) => entry.id === input.itemId);
  if (!item) throw new Error('Item not found.');

  if (quantity < 0) {
    const writeOff = Math.abs(quantity);
    if (writeOff > remainingStock(item)) {
      throw new Error(`Stock-এ মাত্র ${remainingStock(item)} ${item.unit} আছে।`);
    }
    const fifoSlices = await consumeFifoLots(item, writeOff);
    const updated = normalizeItem({
      ...item,
      soldQty: item.soldQty + writeOff,
      updatedAt: new Date().toISOString(),
    });
    await persistItem(updated);
    await persistMovement(
      normalizeMovement({
        id: generateId('mov'),
        itemId: item.id,
        itemName: item.name,
        type: 'adjustment',
        quantity,
        unitPrice: item.costRate,
        totalAmount: fifoCostTotal(fifoSlices),
        date: new Date().toISOString().slice(0, 10),
        note: input.reason.trim(),
        createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
        createdAt: new Date().toISOString(),
        fifoSlices,
      }),
    );
    return updated;
  }

  const date = new Date().toISOString().slice(0, 10);
  const updated = normalizeItem({
    ...item,
    purchasedQty: item.purchasedQty + quantity,
    updatedAt: new Date().toISOString(),
  });

  await persistItem(updated);
  await persistLot(
    buildLot({
      item: updated,
      quantity,
      unitCost: item.costRate,
      receivedDate: date,
      note: input.reason.trim(),
      createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
    }),
  );
  await persistMovement(
    normalizeMovement({
      id: generateId('mov'),
      itemId: item.id,
      itemName: item.name,
      type: 'adjustment',
      quantity,
      unitPrice: item.costRate,
      totalAmount: Math.abs(quantity) * item.costRate,
      date,
      note: input.reason.trim(),
      createdBy: input.createdBy ?? getCurrentActorLabel('Accounts Department'),
      createdAt: new Date().toISOString(),
    }),
  );

  return updated;
}

export function findLowStockItems(items: InventoryItem[]): InventoryStockAlert[] {
  return items
    .filter((item) => !item.archived && item.lowStockThreshold > 0)
    .map((item) => {
      const remaining = remainingStock(item);
      return { item, remaining, shortBy: item.lowStockThreshold - remaining };
    })
    .filter((alert) => alert.remaining <= alert.item.lowStockThreshold)
    .sort((a, b) => b.shortBy - a.shortBy);
}

/** Low-stock purchase alerts shown to both Accounts and the Principal. */
export async function fetchLowStockAlerts(): Promise<InventoryStockAlert[]> {
  return findLowStockItems(await fetchInventoryItems());
}

export function computeInventoryStats(
  items: InventoryItem[],
  movements: InventoryMovement[],
  lots: InventoryLot[] = [],
) {
  const sales = movements.filter((movement) => movement.type === 'sale');
  const month = new Date().toISOString().slice(0, 7);
  const monthSales = sales.filter((movement) => movement.date.startsWith(month));

  return {
    itemCount: items.length,
    totalStock: items.reduce((sum, item) => sum + remainingStock(item), 0),
    stockValue: items.reduce((sum, item) => sum + stockValue(item, lots), 0),
    lowStockCount: findLowStockItems(items).length,
    monthSaleAmount: monthSales.reduce((sum, movement) => sum + movement.totalAmount, 0),
    monthSaleQty: monthSales.reduce((sum, movement) => sum + movement.quantity, 0),
  };
}
