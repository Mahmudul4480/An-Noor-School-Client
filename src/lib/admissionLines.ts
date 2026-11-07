import type { AdmissionInventoryLine, FeeStructureItem } from '../types';

/** Fee lines whose amount is typed on the admission form (book, copy, stationery). */
export const MANUAL_ADMISSION_FEE_KEYS = ['book', 'copy', 'stationery'] as const;

export interface AccountPosting {
  accountId: string;
  amount: number;
  label: string;
}

/**
 * Split the money received today across fee lines.
 * Older admissions have no per-line account: the whole paid amount stays on the single account.
 * A partial payment fills lines from the top, each into its own account.
 */
export function feeAccountPostings(
  items: Pick<FeeStructureItem, 'label' | 'amount' | 'accountId'>[],
  paidAmount: number,
  fallbackAccountId?: string,
): AccountPosting[] {
  const leftStart = Math.round((Number(paidAmount) || 0) * 100) / 100;
  if (leftStart <= 0) return [];
  const positive = items.filter((item) => item.amount > 0);
  const split = positive.some((item) => item.accountId);
  if (!split) {
    return fallbackAccountId ? [{ accountId: fallbackAccountId, amount: leftStart, label: 'Admission Fee' }] : [];
  }
  let left = leftStart;
  const postings: AccountPosting[] = [];
  for (const item of positive) {
    if (left <= 0) break;
    const accountId = item.accountId || fallbackAccountId;
    if (!accountId) continue;
    const take = Math.min(left, Math.round(item.amount * 100) / 100);
    if (take <= 0) continue;
    postings.push({ accountId, amount: take, label: item.label });
    left = Math.round((left - take) * 100) / 100;
  }
  return postings;
}

export function inventoryLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(Math.max(0, quantity) * Math.max(0, unitPrice) * 100) / 100;
}

/** Live stock must be known and enough, or the admission line is refused. */
export function admissionStockError(quantity: number, live: number | null, unit: string): string | null {
  if (live === null || !Number.isFinite(live)) {
    return 'স্টক এই মুহূর্তে দেখা যাচ্ছে না। এন্ট্রি নেওয়া যাবে না।';
  }
  if (quantity > live) {
    return live <= 0
      ? 'এই আইটেমের স্টক শেষ। এন্ট্রি নেওয়া যাবে না।'
      : `স্টকে মাত্র ${live} ${unit} আছে। তার বেশি নেওয়া যাবে না।`;
  }
  return null;
}

export function inventoryLineDescription(line: Pick<AdmissionInventoryLine, 'itemName' | 'quantity' | 'unit'>): string {
  return `${line.itemName} × ${line.quantity} ${line.unit}`;
}
