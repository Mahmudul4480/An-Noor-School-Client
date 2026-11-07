import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { admissionStockError, inventoryLineDescription, inventoryLineTotal } from './admissionLines';
import {
  ADMISSIONS_COLLECTION,
  createAdmission,
  prepareAdmission,
  writeNewAdmission,
  type CreateAdmissionInput,
} from './admissions';
import { db } from './firebase';
import { isDemoLoginEnabled } from './auth';
import { INCOME_COLLECTION, buildPendingIncomeEntry, incomeCreatePayload } from './income';
import {
  ITEMS_COLLECTION,
  LOTS_COLLECTION,
  MOVEMENTS_COLLECTION,
  consumeLotsInMemory,
  fetchInventoryItems,
  fetchInventoryLots,
  recordInventorySale,
  remainingStock,
} from './inventory';
import { INVENTORY_SALE_CATEGORY } from './inventoryQuantity';
import { getCurrentActorLabel } from './actor';
import { dhakaToday, omitUndefined } from './utils';
import type { Admission, AdmissionInventoryLine, IncomeEntry, InventoryItem, InventoryLot, InventoryMovement } from '../types';

export interface AdmissionStockLine {
  itemId: string;
  quantity: number;
  unitPrice: number;
  accountId: string;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function asItem(id: string, data: Record<string, unknown>): InventoryItem {
  const costRate = Number(data.costRate) || 0;
  return {
    ...(data as unknown as InventoryItem),
    id,
    name: String(data.name ?? ''),
    unit: String(data.unit ?? 'pcs'),
    costRate,
    studentPrice: Number(data.studentPrice) || costRate,
    purchasedQty: Number(data.purchasedQty) || 0,
    soldQty: Number(data.soldQty) || 0,
    lowStockThreshold: Number(data.lowStockThreshold) || 0,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
  };
}

function asLot(id: string, data: Record<string, unknown>): InventoryLot {
  return {
    ...(data as unknown as InventoryLot),
    id,
    itemId: String(data.itemId ?? ''),
    quantity: Number(data.quantity) || 0,
    remainingQty: Number(data.remainingQty) || 0,
    unitCost: Number(data.unitCost) || 0,
    receivedDate: String(data.receivedDate ?? '').slice(0, 10),
  };
}

/**
 * Save an admission and, when book/copy/stationery stock is included, sell that
 * stock in the same transaction. A stock change since the form was filled refuses the save.
 */
export async function createAdmissionWithStock(
  input: CreateAdmissionInput,
  lines: AdmissionStockLine[],
): Promise<Admission> {
  const stockLines = lines.filter((line) => line.quantity > 0);
  if (!stockLines.length) return createAdmission(input);

  const items = await fetchInventoryItems({ includeArchived: true });
  const needed = new Map<string, number>();
  for (const line of stockLines) {
    if (!line.accountId && line.unitPrice > 0) throw new Error('বই/খাতা/স্টেশনারির টাকা কোন অ্যাকাউন্টে জমা হবে সেটি বেছে নিন।');
    needed.set(line.itemId, (needed.get(line.itemId) ?? 0) + Math.floor(line.quantity));
  }
  for (const [itemId, quantity] of needed) {
    const item = items.find((entry) => entry.id === itemId && !entry.archived);
    if (!item) throw new Error('ইনভেন্টরি আইটেম পাওয়া যায়নি।');
    const message = admissionStockError(quantity, remainingStock(item), item.unit);
    if (message) throw new Error(message);
  }

  const inventoryLines: AdmissionInventoryLine[] = stockLines.map((line) => {
    const item = items.find((entry) => entry.id === line.itemId)!;
    return {
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      quantity: Math.floor(line.quantity),
      unitPrice: Math.round(line.unitPrice * 100) / 100,
      lineTotal: inventoryLineTotal(Math.floor(line.quantity), line.unitPrice),
      accountId: line.accountId,
    };
  });

  const admission = await prepareAdmission({ ...input, inventoryLines });

  if (isDemoLoginEnabled) {
    const latest = await fetchInventoryItems({ includeArchived: true });
    for (const line of inventoryLines) {
      const item = latest.find((entry) => entry.id === line.itemId && !entry.archived);
      const message = admissionStockError(line.quantity, item ? remainingStock(item) : null, line.unit);
      if (message) throw new Error(`স্টক এই মুহূর্তে বদলে গেছে। ${message}`);
    }
    const linked: AdmissionInventoryLine[] = [];
    for (const line of inventoryLines) {
      const sale = await recordInventorySale({
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        accountId: line.accountId,
        buyerName: input.studentName,
        note: `ভর্তি ${admission.formSerial}`,
        reference: admission.id,
        postImmediately: false,
      });
      linked.push({ ...line, incomeId: sale.income?.id, movementId: sale.movement.id });
    }
    const saved = { ...admission, inventoryLines: linked };
    await writeNewAdmission(saved);
    return saved;
  }

  const knownLots = await fetchInventoryLots();
  const date = dhakaToday();
  const actor = getCurrentActorLabel('Accounts Department');
  const prepared: { line: AdmissionInventoryLine; income: IncomeEntry | null; movementId: string }[] = [];
  for (const line of inventoryLines) {
    const movementId = generateId('mov');
    const income = line.lineTotal > 0
      ? await buildPendingIncomeEntry({
          date,
          category: INVENTORY_SALE_CATEGORY,
          source: input.studentName.trim(),
          description: inventoryLineDescription(line),
          amount: line.lineTotal,
          accountId: line.accountId,
          reference: admission.id,
          note: `ভর্তি ${admission.formSerial} • স্টক বিক্রি ${movementId}`,
          createdBy: actor,
        })
      : null;
    prepared.push({ line: { ...line, incomeId: income?.id, movementId }, income, movementId });
  }

  await runTransaction(db, async (tx) => {
    const itemIds = [...new Set(prepared.map((entry) => entry.line.itemId))];
    const itemSnaps = new Map<string, InventoryItem>();
    for (const itemId of itemIds) {
      const snap = await tx.get(doc(db, ITEMS_COLLECTION, itemId));
      if (!snap.exists()) throw new Error('স্টক এই মুহূর্তে বদলে গেছে। আইটেম আর নেই।');
      itemSnaps.set(itemId, asItem(itemId, snap.data() as Record<string, unknown>));
    }
    const lotSnaps: InventoryLot[] = [];
    for (const lot of knownLots.filter((entry) => itemIds.includes(entry.itemId))) {
      const snap = await tx.get(doc(db, LOTS_COLLECTION, lot.id));
      if (snap.exists()) lotSnaps.push(asLot(lot.id, snap.data() as Record<string, unknown>));
    }

    const workingItems = new Map(itemSnaps);
    let workingLots = lotSnaps;
    const dirtyLots = new Map<string, InventoryLot>();
    const movements: InventoryMovement[] = [];

    for (const entry of prepared) {
      const item = workingItems.get(entry.line.itemId);
      if (!item) throw new Error('স্টক এই মুহূর্তে বদলে গেছে। আবার চেষ্টা করুন।');
      const live = remainingStock(item);
      const blocked = admissionStockError(entry.line.quantity, live, item.unit);
      if (blocked) throw new Error(`স্টক এই মুহূর্তে বদলে গেছে। ${blocked}`);
      let consumed;
      try {
        consumed = consumeLotsInMemory(item, workingLots, entry.line.quantity);
      } catch {
        throw new Error('স্টক এই মুহূর্তে বদলে গেছে। আবার চেষ্টা করুন।');
      }
      const updated = { ...item, soldQty: item.soldQty + entry.line.quantity, updatedAt: new Date().toISOString() };
      workingItems.set(item.id, updated);
      workingLots = workingLots.filter((lot) => !consumed.lots.some((changed) => changed.id === lot.id)).concat(consumed.lots);
      for (const lot of consumed.lots) dirtyLots.set(lot.id, lot);
      const fifoNote = consumed.slices.map((slice) => `${slice.lotDate}×${slice.quantity}@${slice.unitCost}`).join(', ');
      movements.push({
        id: entry.movementId,
        itemId: item.id,
        itemName: item.name,
        type: 'sale',
        quantity: entry.line.quantity,
        unitPrice: entry.line.unitPrice,
        totalAmount: entry.line.lineTotal,
        buyerName: input.studentName.trim(),
        accountId: entry.line.accountId,
        date,
        note: [`ভর্তি ${admission.formSerial}`, fifoNote ? `FIFO: ${fifoNote}` : ''].filter(Boolean).join(' • '),
        createdBy: actor,
        createdAt: new Date().toISOString(),
        fifoSlices: consumed.slices,
      });
    }

    for (const item of workingItems.values()) {
      tx.set(doc(db, ITEMS_COLLECTION, item.id), omitUndefined({ ...item }), { merge: true });
    }
    for (const lot of dirtyLots.values()) {
      tx.set(doc(db, LOTS_COLLECTION, lot.id), omitUndefined({ ...lot }), { merge: true });
    }
    for (const movement of movements) {
      tx.set(doc(db, MOVEMENTS_COLLECTION, movement.id), omitUndefined({ ...movement, createdAt: serverTimestamp() }));
    }
    for (const entry of prepared) {
      if (entry.income) tx.set(doc(db, INCOME_COLLECTION, entry.income.id), incomeCreatePayload(entry.income));
    }
    const saved = { ...admission, inventoryLines: prepared.map((entry) => entry.line) };
    tx.set(
      doc(db, ADMISSIONS_COLLECTION, admission.id),
      omitUndefined({ ...saved, createdAt: serverTimestamp(), updatedAt: serverTimestamp() } as Record<string, unknown>),
    );
  });

  return { ...admission, inventoryLines: prepared.map((entry) => entry.line) };
}
