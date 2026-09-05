import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Firestore rejects `undefined` field values — omit them before write. */
export function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

/** Convert Firestore Timestamp / Date / string into a stable ISO string. */
export function toIsoString(value: unknown, fallback = new Date().toISOString()): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return fallback;
}

/** Signed money: negatives render as `-৳ 1,200` so overdrawn petty cash is obvious. */
export function formatSignedBdt(amount: number): string {
  const abs = Math.abs(Number(amount) || 0).toLocaleString('en-BD');
  return amount < 0 ? `-৳ ${abs}` : `৳ ${abs}`;
}
