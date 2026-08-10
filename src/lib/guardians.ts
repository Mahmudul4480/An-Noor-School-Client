import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled } from './auth';
import type { GuardianAccount } from '../types';

const GUARDIANS_COLLECTION = 'guardians';
const LOCAL_GUARDIANS_KEY = 'an-noor-guardians';
const GUARDIAN_EMAIL_DOMAIN = 'guardians.al-noor-int-school.local';

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

export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '');
}

export function mobileToAuthEmail(mobile: string): string {
  const digits = normalizeMobile(mobile);
  return `g${digits}@${GUARDIAN_EMAIL_DOMAIN}`;
}

export function isGuardianAuthEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${GUARDIAN_EMAIL_DOMAIN}`);
}

export function generateGuardianPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < 8; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

export function isMobileNumber(input: string): boolean {
  const digits = normalizeMobile(input);
  return digits.length >= 10 && digits.length <= 14;
}

async function createFirebaseGuardianUser(email: string, password: string): Promise<'created' | 'exists'> {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    },
  );
  const data = (await response.json()) as { error?: { message?: string } };
  if (data.error?.message === 'EMAIL_EXISTS') return 'exists';
  if (data.error) throw new Error(data.error.message ?? 'Failed to create guardian login.');
  return 'created';
}

export async function provisionGuardianLogin(params: {
  mobile: string;
  guardianName: string;
  studentId: string;
}): Promise<{ mobile: string; password?: string; isNewAccount: boolean }> {
  const mobile = normalizeMobile(params.mobile);
  const authEmail = mobileToAuthEmail(mobile);
  const password = generateGuardianPassword();

  if (isDemoLoginEnabled) {
    const guardians = readLocal<GuardianAccount[]>(LOCAL_GUARDIANS_KEY, []);
    const existing = guardians.find((g) => g.mobile === mobile);
    if (existing) {
      const updated = guardians.map((g) =>
        g.mobile === mobile
          ? { ...g, studentIds: g.studentIds.includes(params.studentId) ? g.studentIds : [...g.studentIds, params.studentId] }
          : g,
      );
      writeLocal(LOCAL_GUARDIANS_KEY, updated);
      localStorage.setItem(`guardian-pwd-${mobile}`, password);
      return { mobile, isNewAccount: false };
    }
    const account: GuardianAccount = {
      id: `grd-${mobile}`,
      mobile,
      authEmail,
      guardianName: params.guardianName,
      studentIds: [params.studentId],
      createdAt: new Date().toISOString(),
    };
    writeLocal(LOCAL_GUARDIANS_KEY, [...guardians, account]);
    localStorage.setItem(`guardian-pwd-${mobile}`, password);
    return { mobile, password, isNewAccount: true };
  }

  const snapshot = await getDocs(query(collection(db, GUARDIANS_COLLECTION), where('mobile', '==', mobile)));
  const existingDoc = snapshot.docs[0];

  if (existingDoc) {
    const data = existingDoc.data() as GuardianAccount;
    const studentIds = data.studentIds.includes(params.studentId)
      ? data.studentIds
      : [...data.studentIds, params.studentId];
    await updateDoc(doc(db, GUARDIANS_COLLECTION, existingDoc.id), { studentIds, updatedAt: serverTimestamp() });
    return { mobile, isNewAccount: false };
  }

  const result = await createFirebaseGuardianUser(authEmail, password);
  const account: GuardianAccount = {
    id: `grd-${mobile}`,
    mobile,
    authEmail,
    guardianName: params.guardianName,
    studentIds: [params.studentId],
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, GUARDIANS_COLLECTION, account.id), { ...account, createdAt: serverTimestamp() });

  return {
    mobile,
    password: result === 'created' ? password : undefined,
    isNewAccount: result === 'created',
  };
}

export async function fetchGuardianByMobile(mobile: string): Promise<GuardianAccount | null> {
  const normalized = normalizeMobile(mobile);

  if (isDemoLoginEnabled) {
    const guardians = readLocal<GuardianAccount[]>(LOCAL_GUARDIANS_KEY, []);
    return guardians.find((g) => g.mobile === normalized) ?? null;
  }

  const snapshot = await getDocs(query(collection(db, GUARDIANS_COLLECTION), where('mobile', '==', normalized)));
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as GuardianAccount;
}

export async function fetchGuardianByAuthEmail(email: string): Promise<GuardianAccount | null> {
  if (isDemoLoginEnabled) {
    const guardians = readLocal<GuardianAccount[]>(LOCAL_GUARDIANS_KEY, []);
    return guardians.find((g) => g.authEmail === email.toLowerCase()) ?? null;
  }

  const snapshot = await getDocs(query(collection(db, GUARDIANS_COLLECTION), where('authEmail', '==', email.toLowerCase())));
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as GuardianAccount;
}
