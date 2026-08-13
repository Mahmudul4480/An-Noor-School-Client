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
