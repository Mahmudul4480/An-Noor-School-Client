export interface FriendlyError {
  bn: string;
  en: string;
}

const MAP: Record<string, FriendlyError> = {
  'permission-denied': { bn: 'আপনার এই কাজের অনুমতি নেই', en: 'You do not have permission for this action. Ask the admin for access.' },
  'storage/unauthorized': { bn: 'আপনার এই কাজের অনুমতি নেই', en: 'You do not have permission to upload this file.' },
  'storage/unauthenticated': { bn: 'আবার লগইন করুন, তারপর চেষ্টা করুন', en: 'Your session expired. Please log in again.' },
  unauthenticated: { bn: 'আবার লগইন করুন, তারপর চেষ্টা করুন', en: 'Your session expired. Please log in again.' },
  unavailable: { bn: 'ইন্টারনেট সংযোগ দেখুন, আবার চেষ্টা করুন', en: 'Connection problem. Check your internet and try again.' },
  'auth/network-request-failed': { bn: 'ইন্টারনেট সংযোগ দেখুন, আবার চেষ্টা করুন', en: 'Connection problem. Check your internet and try again.' },
  'storage/retry-limit-exceeded': { bn: 'ইন্টারনেট সংযোগ দেখুন, আবার চেষ্টা করুন', en: 'Upload timed out. Check your internet and try again.' },
  'deadline-exceeded': { bn: 'ইন্টারনেট সংযোগ দেখুন, আবার চেষ্টা করুন', en: 'The request took too long. Try again.' },
  'invalid-argument': { bn: 'কিছু তথ্য ঠিকমতো দেওয়া হয়নি, লাল দাগ দেওয়া ঘর দেখুন', en: 'Some information is missing or invalid. Check the fields marked in red.' },
  'failed-precondition': { bn: 'কিছু তথ্য ঠিকমতো দেওয়া হয়নি, লাল দাগ দেওয়া ঘর দেখুন', en: 'Some information is missing or invalid. Check the fields marked in red.' },
  'not-found': { bn: 'তথ্যটি খুঁজে পাওয়া যায়নি', en: 'The record was not found. Refresh the page and try again.' },
  'already-exists': { bn: 'এই তথ্য আগেই আছে', en: 'This record already exists.' },
  'resource-exhausted': { bn: 'অনেকবার চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন', en: 'Too many requests. Wait a moment and try again.' },
  'auth/too-many-requests': { bn: 'অনেকবার চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন', en: 'Too many attempts. Try again later.' },
  'storage/quota-exceeded': { bn: 'ফাইল রাখার জায়গা শেষ, অ্যাডমিনকে জানান', en: 'Storage is full. Contact the admin.' },
  'storage/canceled': { bn: 'আপলোড বাতিল হয়েছে', en: 'The upload was cancelled.' },
};

export const GENERIC_ERROR: FriendlyError = {
  bn: 'কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন। সমস্যা থাকলে অ্যাডমিনকে জানান',
  en: 'Something went wrong. Please try again, or contact the admin if it continues.',
};

export function toFriendlyError(error: unknown): FriendlyError {
  console.error('[app error]', error);
  const raw = error as { code?: string; message?: string } | null;
  let code = raw?.code ?? '';
  if (code.startsWith('firestore/')) code = code.slice(10);
  if (MAP[code]) return MAP[code];
  const msg = raw?.message ?? '';
  if (/invalid data|Unsupported field value|invalid-argument/i.test(msg)) return MAP['invalid-argument'];
  if (/offline|network|Failed to fetch/i.test(msg)) return MAP.unavailable;
  return GENERIC_ERROR;
}

export function friendlyErrorText(error: unknown): string {
  const f = toFriendlyError(error);
  return `${f.bn}\n${f.en}`;
}

/**
 * For catch blocks: Firebase errors (with a code) become the friendly Bangla +
 * English text; plain app validation errors keep their own message.
 */
export function userErrorMessage(error: unknown, fallback?: string): string {
  const raw = error as { code?: string; message?: string; name?: string } | null;
  const isFirebase = !!raw?.code || raw?.name === 'FirebaseError' || /firebase|storage\/|setDoc|addDoc|updateDoc/i.test(raw?.message ?? '');
  if (isFirebase || !(error instanceof Error) || !error.message) {
    if (!isFirebase && fallback && !(error instanceof Error)) {
      console.error('[app error]', error);
      return fallback;
    }
    return friendlyErrorText(error);
  }
  console.error('[app error]', error);
  return error.message;
}
