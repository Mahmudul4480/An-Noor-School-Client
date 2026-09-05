import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { omitUndefined } from './utils';
import type { SchoolSettings } from '../types';

const SETTINGS_COLLECTION = 'schoolSettings';
const SETTINGS_DOC = 'profile';
const LOCAL_SETTINGS_KEY = 'an-noor-school-settings';
const CACHE_KEY = 'an-noor-school-settings-cache';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'An-Noor International School',
  shortName: 'ANIS',
  address: 'Rahamatgong, Chattogram',
  city: 'Chattogram',
  phone: '',
  email: '',
  website: '',
  eiin: '',
  academicYear: '2025-26',
  sessionLabel: 'Session 2025-26',
  principalName: '',
  currency: 'BDT',
  fiscalYearStartMonth: '01',
  receiptFooter: 'Thank you for choosing An-Noor International School.',
  smsEnabled: false,
  emailNotifyEnabled: false,
  updatedAt: new Date().toISOString(),
};

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

function normalizeSettings(raw?: Partial<SchoolSettings> | null): SchoolSettings {
  return {
    ...DEFAULT_SCHOOL_SETTINGS,
    ...raw,
    schoolName: raw?.schoolName?.trim() || DEFAULT_SCHOOL_SETTINGS.schoolName,
    shortName: raw?.shortName?.trim() || DEFAULT_SCHOOL_SETTINGS.shortName,
    address: raw?.address?.trim() || DEFAULT_SCHOOL_SETTINGS.address,
    academicYear: raw?.academicYear?.trim() || DEFAULT_SCHOOL_SETTINGS.academicYear,
    sessionLabel: raw?.sessionLabel?.trim() || DEFAULT_SCHOOL_SETTINGS.sessionLabel,
    currency: raw?.currency?.trim() || DEFAULT_SCHOOL_SETTINGS.currency,
    fiscalYearStartMonth: raw?.fiscalYearStartMonth || DEFAULT_SCHOOL_SETTINGS.fiscalYearStartMonth,
    smsEnabled: Boolean(raw?.smsEnabled),
    emailNotifyEnabled: Boolean(raw?.emailNotifyEnabled),
    updatedAt: raw?.updatedAt || new Date().toISOString(),
  };
}

function cacheSettings(settings: SchoolSettings) {
  writeLocal(CACHE_KEY, settings);
}

export function getCachedSchoolSettings(): SchoolSettings {
  return normalizeSettings(readLocal<Partial<SchoolSettings> | null>(CACHE_KEY, null));
}

export async function fetchSchoolSettings(): Promise<SchoolSettings> {
  if (isDemoLoginEnabled) {
    const settings = normalizeSettings(readLocal<Partial<SchoolSettings> | null>(LOCAL_SETTINGS_KEY, null));
    cacheSettings(settings);
    return settings;
  }

  await waitForAuthUser();
  const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC));
  const settings = normalizeSettings(snapshot.exists() ? (snapshot.data() as Partial<SchoolSettings>) : null);
  cacheSettings(settings);
  return settings;
}

export async function saveSchoolSettings(
  input: Partial<SchoolSettings>,
  updatedBy: string,
): Promise<SchoolSettings> {
  const current = await fetchSchoolSettings();
  const next = normalizeSettings({
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });

  if (isDemoLoginEnabled) {
    writeLocal(LOCAL_SETTINGS_KEY, next);
    cacheSettings(next);
    return next;
  }

  await waitForAuthUser();
  await setDoc(
    doc(db, SETTINGS_COLLECTION, SETTINGS_DOC),
    omitUndefined({ ...next, updatedAt: serverTimestamp() }),
    { merge: true },
  );
  cacheSettings(next);
  return next;
}
