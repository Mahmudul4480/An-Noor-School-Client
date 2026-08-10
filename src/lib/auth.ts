import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { fetchGuardianByAuthEmail, isGuardianAuthEmail, isMobileNumber, mobileToAuthEmail, normalizeMobile } from './guardians';
import type { UserRole } from '../types';

export const isDemoLoginEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

const SUPER_ADMIN_EMAILS = ['chotan4480@gmail.com', 'chotan4480+admin@gmail.com'];

function persistSession(role: UserRole, extra?: { guardianMobile?: string }) {
  localStorage.setItem('userRole', role);
  if (extra?.guardianMobile) {
    localStorage.setItem('guardianMobile', extra.guardianMobile);
  } else if (role !== 'guardian') {
    localStorage.removeItem('guardianMobile');
  }
  if (role === 'super_admin') {
    localStorage.removeItem('adminCurrentView');
  }
}

export function demoLogin(userId: string, selectedRole: UserRole): UserRole {
  const finalRole = SUPER_ADMIN_EMAILS.includes(userId.trim().toLowerCase()) ? 'super_admin' : selectedRole;
  if (finalRole === 'guardian' && isMobileNumber(userId)) {
    persistSession(finalRole, { guardianMobile: normalizeMobile(userId) });
  } else {
    persistSession(finalRole);
  }
  return finalRole;
}

async function resolveUserRole(user: User): Promise<UserRole> {
  if (user.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return 'super_admin';
  }

  if (user.email && isGuardianAuthEmail(user.email)) {
    const guardian = await fetchGuardianByAuthEmail(user.email);
    if (guardian) {
      persistSession('guardian', { guardianMobile: guardian.mobile });
      return 'guardian';
    }
  }

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists() && userDoc.data().role) {
    return userDoc.data().role as UserRole;
  }

  throw new Error(
    'Your account is not configured yet. Please contact the administrator.',
  );
}

function resolveLoginEmail(input: string): string {
  const trimmed = input.trim();
  if (isMobileNumber(trimmed)) {
    return mobileToAuthEmail(trimmed);
  }
  return trimmed;
}

export async function firebaseLogin(email: string, password: string): Promise<UserRole> {
  const loginEmail = resolveLoginEmail(email);
  const credential = await signInWithEmailAndPassword(auth, loginEmail, password);
  const role = await resolveUserRole(credential.user);
  persistSession(role);
  return role;
}

export async function logout(): Promise<void> {
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminCurrentView');
  localStorage.removeItem('guardianMobile');

  if (!isDemoLoginEnabled && auth.currentUser) {
    await signOut(auth);
  }
}

/** Wait until Firebase Auth session is ready (production mode). */
export async function waitForAuthUser(timeoutMs = 8000): Promise<User> {
  if (isDemoLoginEnabled) {
    throw new Error('waitForAuthUser should not be called in demo mode.');
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      unsubscribe();
      reject(new Error('Login session expired. Please log out and sign in again.'));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        window.clearTimeout(timer);
        unsubscribe();
        resolve(user);
      }
    });
  });
}

export function subscribeToAuthState(onChange: (isAuthenticated: boolean) => void) {
  if (isDemoLoginEnabled) {
    onChange(Boolean(localStorage.getItem('userRole')));
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    onChange(Boolean(user && localStorage.getItem('userRole')));
  });
}

export function getFirebaseOperationErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Operation failed. Please try again.';
  }

  const code = (error as Error & { code?: string }).code;
  switch (code) {
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection, then log out and sign in again.';
    case 'permission-denied':
      return 'Permission denied. Make sure you are logged in with an authorized account.';
    case 'unavailable':
      return 'Firebase is temporarily unavailable. Please try again in a moment.';
    case 'storage/unauthorized':
    case 'storage/unauthenticated':
      return 'File upload is not available yet. Submit without the scanned form, or contact admin to enable Firebase Storage.';
    default:
      return error.message || 'Operation failed. Please try again.';
  }
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Login failed. Please try again.';
  }

  const code = (error as Error & { code?: string }).code;
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return error.message || 'Login failed. Please try again.';
  }
}
