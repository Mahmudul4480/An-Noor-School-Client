/** Whole-number store units. Stock for these is never a fraction. */
export const INVENTORY_UNIT_OPTIONS = ['pcs', 'copy', 'set', 'packet', 'ream', 'box', 'dozen'] as const;

const FRACTIONAL_UNITS = new Set(['kg', 'g', 'gram', 'litre', 'liter', 'ltr', 'ml', 'meter', 'metre']);

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export const OPENING_STOCK_NOTE = 'প্রাথমিক স্টক';

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
