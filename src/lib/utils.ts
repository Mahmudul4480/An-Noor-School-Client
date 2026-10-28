import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function stripUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined).map(stripUndefinedDeep);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefinedDeep(item)]),
    );
  }
  // Timestamps, FieldValues (serverTimestamp), Dates etc. pass through untouched.
  return value;
}

/** Firestore rejects `undefined` field values — omit them (also nested) before write. */
export function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return stripUndefinedDeep(obj) as Partial<T>;
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
