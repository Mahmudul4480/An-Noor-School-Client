import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { clearActor, persistActor } from './actor';
import { fetchGuardianByAuthEmail, isGuardianAuthEmail, isMobileNumber, mobileToAuthEmail, normalizeMobile } from './guardians';
import { peekStaffAccessByEmail } from './staffAccess';
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

function persistLoginIdentity(input: { email?: string; name?: string; uid?: string }) {
  persistActor({
    email: input.email,
    name: input.name,
    uid: input.uid,
  });
}

export function demoLogin(userId: string, selectedRole: UserRole): UserRole {
  const trimmed = userId.trim();
  const email = trimmed.includes('@') ? trimmed.toLowerCase() : '';
  persistLoginIdentity({
    email: email || trimmed,
    name: trimmed,
    uid: `demo-${trimmed.toLowerCase()}`,
  });

  if (email && SUPER_ADMIN_EMAILS.includes(email)) {
    persistSession('super_admin');
    persistLoginIdentity({ name: 'Master Admin', email });
    return 'super_admin';
  }

  if (email) {
    const grant = peekStaffAccessByEmail(email);
    if (grant?.status === 'active') {
      persistSession(grant.role);
      persistLoginIdentity({ email: grant.email, name: grant.name });
      return grant.role;
    }
    if (grant?.status === 'revoked' && selectedRole === 'accounts') {
      throw new Error('Your Accounts access has been revoked. Contact the Principal Office.');
    }
  }

  const finalRole = selectedRole;
  if (finalRole === 'guardian' && isMobileNumber(userId)) {
    persistSession(finalRole, { guardianMobile: normalizeMobile(userId) });
  } else {
    persistSession(finalRole);
  }
  return finalRole;
}

async function resolveUserRole(user: User): Promise<UserRole> {
  persistLoginIdentity({
    email: user.email ?? '',
    name: user.displayName ?? '',
    uid: user.uid,
  });

  if (user.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    persistLoginIdentity({ name: 'Master Admin', email: user.email });
    return 'super_admin';
  }

  if (user.email && isGuardianAuthEmail(user.email)) {
    const guardian = await fetchGuardianByAuthEmail(user.email);
    if (guardian) {
      persistSession('guardian', { guardianMobile: guardian.mobile });
      persistLoginIdentity({ name: guardian.guardianName, email: user.email });
      return 'guardian';
    }
  }

  if (user.email) {
    const { fetchStaffAccessByEmail } = await import('./staffAccess');
    const grant = await fetchStaffAccessByEmail(user.email);
    if (grant?.status === 'active') {
      persistLoginIdentity({ email: grant.email, name: grant.name, uid: user.uid });
      return grant.role;
    }
    if (grant?.status === 'revoked') {
      throw new Error('Your Accounts access has been revoked. Contact the Principal Office.');
    }
  }

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists() && userDoc.data().role) {
    const data = userDoc.data();
    persistLoginIdentity({
      email: user.email ?? data.email,
      name: data.name || user.displayName || '',
      uid: user.uid,
    });
    return data.role as UserRole;
  }

  throw new Error(
    'Your account is not configured yet. Ask the Principal Office to grant access.',
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
  persistLoginIdentity({
    email: credential.user.email ?? loginEmail,
    uid: credential.user.uid,
    name: credential.user.displayName ?? undefined,
  });
  return role;
}

export async function logout(): Promise<void> {
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminCurrentView');
  localStorage.removeItem('guardianMobile');
  clearActor();

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
    case 'auth/unauthorized-domain':
      return 'This site address is not allowed in Firebase. Open http://localhost:3000 — not the 192.168.x.x network URL.';
    case 'auth/api-key-not-valid':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase API key is blocked for this address. Allow localhost in Google Cloud API key restrictions.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return error.message || 'Login failed. Please try again.';
  }
}
