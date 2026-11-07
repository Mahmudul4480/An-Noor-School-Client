/** Whole-number store units. Stock for these is never a fraction. */
export const INVENTORY_UNIT_OPTIONS = ['pcs', 'copy', 'set', 'packet', 'ream', 'box', 'dozen'] as const;

const FRACTIONAL_UNITS = new Set(['kg', 'g', 'gram', 'litre', 'liter', 'ltr', 'ml', 'meter', 'metre']);

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export const OPENING_STOCK_NOTE = 'প্রাথমিক স্টক';

/** Income category used when stock is sold. Also listed with the other income categories. */
export const INVENTORY_SALE_CATEGORY = 'ইনভেন্টরি বিক্রয়';

/** Counter sale income is credited at once. Other categories are left untouched. */
export function creditInventorySaleNow<T extends { category: string; createdBy?: string; createdAt: string; approvalStatus: string }>(
  entry: T,
  sale: { itemName: string; quantity: number; unit: string; unitPrice: number; movementId: string },
): T & {
  approvalStatus: string;
  reviewedBy?: string;
  reviewedAt?: string;
  saleItemName?: string;
  saleQuantity?: number;
  saleUnit?: string;
  saleUnitPrice?: number;
  saleMovementId?: string;
} {
  if (entry.category !== INVENTORY_SALE_CATEGORY) return entry;
  return {
    ...entry,
    approvalStatus: 'approved',
    reviewedBy: entry.createdBy,
    reviewedAt: entry.createdAt,
    saleItemName: sale.itemName,
    saleQuantity: sale.quantity,
    saleUnit: sale.unit,
    saleUnitPrice: sale.unitPrice,
    saleMovementId: sale.movementId,
  };
}

export function stockUnitAllowsDecimal(unit: string): boolean {
  const normalized = unit.trim().toLowerCase();
  if ((INVENTORY_UNIT_OPTIONS as readonly string[]).includes(normalized)) return false;
  return FRACTIONAL_UNITS.has(normalized);
}

/** Western digits, so a Bangla keyboard (১২) is a real number and not dropped. */
export function toWesternDigits(raw: string): string {
  return raw.replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)));
}

export type ParsedNumber = { ok: true; value: number } | { ok: false; message: string };

function normalizedNumeric(raw: string): string {
  return toWesternDigits(raw).trim().replace(/,/g, '');
}

/**
 * Opening quantity typed on New Stock Item.
 * Empty is an error (the field used to become 0 with no warning). 0 is allowed.
 * Decimals only for continuous units; every current store unit is a whole number.
 */
export function parseOpeningQuantity(raw: string, unit: string): ParsedNumber {
  const trimmed = normalizedNumeric(raw);
  if (!trimmed) {
    return { ok: false, message: 'প্রাথমিক পরিমাণ / স্টক সংখ্যা লিখুন। স্টক না থাকলে ০ দিন।' };
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, message: 'পরিমাণ ০ বা তার বেশি সংখ্যায় লিখুন।' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, message: 'পরিমাণ ০ বা তার বেশি হতে হবে।' };
  }
  if (!stockUnitAllowsDecimal(unit)) {
    if (!Number.isInteger(value)) {
      return { ok: false, message: 'এই এককে দশমিক পরিমাণ দেওয়া যাবে না। পূর্ণ সংখ্যা লিখুন।' };
    }
    return { ok: true, value };
  }
  return { ok: true, value: Math.round(value * 1000) / 1000 };
}

/** Taka amounts. Empty is an error; 0 is allowed. Up to two decimal places. */
export function parseMoneyAmount(raw: string, emptyMessage: string): ParsedNumber {
  const trimmed = normalizedNumeric(raw);
  if (!trimmed) return { ok: false, message: emptyMessage };
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, message: 'টাকার পরিমাণ সংখ্যায় লিখুন।' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, message: 'টাকার পরিমাণ ০ বা তার বেশি হতে হবে।' };
  }
  return { ok: true, value: Math.round(value * 100) / 100 };
}

/** Reorder level. Blank means 0 (no alert). Not a decimal. */
export function parseOptionalWholeNumber(raw: string, invalidMessage: string): ParsedNumber {
  const trimmed = normalizedNumeric(raw);
  if (!trimmed) return { ok: true, value: 0 };
  if (!/^\d+$/.test(trimmed)) return { ok: false, message: invalidMessage };
  return { ok: true, value: Number(trimmed) };
}

/**
 * Running total while the user is typing. Stock limits are checked on save;
 * this still multiplies so মোট দাম grows with the quantity. Bangla digits count.
 */
export function liveSaleTotal(quantityRaw: string, priceRaw: string): { quantity: number; unitPrice: number; total: number } {
  const quantity = looseNumber(quantityRaw);
  const unitPrice = Math.round(looseNumber(priceRaw) * 100) / 100;
  return { quantity, unitPrice, total: Math.round(quantity * unitPrice * 100) / 100 };
}

function looseNumber(raw: string): number {
  const trimmed = normalizedNumeric(raw);
  if (!trimmed) return 0;
  const match = trimmed.match(/^\d+(?:\.\d*)?/);
  if (!match) return 0;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : 0;
}

/** Selling price shown on the sale form: the item's sale price, otherwise its cost. */
export function defaultSalePrice(item: { studentPrice?: number; costRate?: number }): number {
  const selling = Number(item.studentPrice);
  if (Number.isFinite(selling) && selling > 0) return selling;
  const cost = Number(item.costRate);
  return Number.isFinite(cost) && cost > 0 ? cost : 0;
}

/** Quantity leaving the shelf. Must be above 0 and not more than what is in stock. */
export function parseSaleQuantity(raw: string, unit: string, available: number): ParsedNumber {
  const trimmed = normalizedNumeric(raw);
  if (!trimmed) return { ok: false, message: 'বিক্রির পরিমাণ লিখুন।' };
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return { ok: false, message: 'পরিমাণ ০-এর বেশি সংখ্যায় লিখুন।' };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, message: 'বিক্রির পরিমাণ ০-এর বেশি হতে হবে।' };
  const quantity = stockUnitAllowsDecimal(unit) ? Math.round(value * 1000) / 1000 : value;
  if (!stockUnitAllowsDecimal(unit) && !Number.isInteger(value)) {
    return { ok: false, message: 'এই এককে দশমিক পরিমাণ দেওয়া যাবে না। পূর্ণ সংখ্যা লিখুন।' };
  }
  if (quantity > available) return { ok: false, message: `স্টকে মাত্র ${available} ${unit} আছে।` };
  return { ok: true, value: quantity };
}

export interface InventorySalePlan {
  soldQty: number;
  total: number;
  income: null | {
    category: string;
    source: string;
    description: string;
    amount: number;
    note?: string;
  };
}

/** What a sale does to stock and to the Income list. A zero total does not create income. */
export function planInventorySale(input: {
  name: string;
  unit: string;
  soldQty: number;
  quantity: number;
  unitPrice: number;
  buyerName?: string;
  note?: string;
}): InventorySalePlan {
  const quantity = input.quantity;
  const unitPrice = Math.round((Number(input.unitPrice) || 0) * 100) / 100;
  const total = Math.round(quantity * unitPrice * 100) / 100;
  const buyer = input.buyerName?.trim() ?? '';
  const extra = input.note?.trim();
  return {
    soldQty: input.soldQty + quantity,
    total,
    income:
      total > 0
        ? {
            category: INVENTORY_SALE_CATEGORY,
            source: buyer || 'কাউন্টার বিক্রি',
            description: `${input.name} × ${quantity} ${input.unit}`,
            amount: total,
            note: extra || undefined,
          }
        : null,
  };
}

export interface OpeningStockPlan {
  purchasedQty: number;
  movement: null | { type: 'purchase'; quantity: number; note: string };
}

/** What creating an item does with the typed opening quantity. */
export function openingStockPlan(quantity: number, unit: string): OpeningStockPlan {
  const numeric = Number(quantity);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { purchasedQty: 0, movement: null };
  }
  const purchasedQty = stockUnitAllowsDecimal(unit)
    ? Math.round(numeric * 1000) / 1000
    : Math.floor(numeric);
  if (purchasedQty <= 0) return { purchasedQty: 0, movement: null };
  return {
    purchasedQty,
    movement: { type: 'purchase', quantity: purchasedQty, note: OPENING_STOCK_NOTE },
  };
}
