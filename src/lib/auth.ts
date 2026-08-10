import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserRole } from '../types';

export const isDemoLoginEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

const SUPER_ADMIN_EMAILS = ['chotan4480@gmail.com', 'chotan4480+admin@gmail.com'];

function persistSession(role: UserRole) {
  localStorage.setItem('userRole', role);
  if (role === 'super_admin') {
    localStorage.removeItem('adminCurrentView');
  }
}

export function demoLogin(userId: string, selectedRole: UserRole): UserRole {
  const finalRole = SUPER_ADMIN_EMAILS.includes(userId.trim().toLowerCase()) ? 'super_admin' : selectedRole;
  persistSession(finalRole);
  return finalRole;
}

async function resolveUserRole(user: User): Promise<UserRole> {
  if (user.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return 'super_admin';
  }

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists() && userDoc.data().role) {
    return userDoc.data().role as UserRole;
  }

  throw new Error(
    'Your account is not configured yet. Please contact the administrator.',
  );
}

export async function firebaseLogin(email: string, password: string): Promise<UserRole> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const role = await resolveUserRole(credential.user);
  persistSession(role);
  return role;
}

export async function logout(): Promise<void> {
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminCurrentView');

  if (!isDemoLoginEnabled && auth.currentUser) {
    await signOut(auth);
  }
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
