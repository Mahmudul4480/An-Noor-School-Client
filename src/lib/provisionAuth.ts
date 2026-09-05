import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, firebaseConfig } from './firebase';
import { isDemoLoginEnabled } from './auth';

export type LoginProvisionResult = {
  status: 'created' | 'already_exists' | 'demo';
  email: string;
  password?: string;
  uid?: string;
};

function generateTempPassword(): string {
  const token = Math.random().toString(36).slice(2, 8);
  return `Anis@${token}1`;
}

/** Create a Firebase login without signing the current user out. */
export async function provisionLoginAccount(
  email: string,
  password?: string,
): Promise<LoginProvisionResult> {
  const loginEmail = email.trim().toLowerCase();
  if (!loginEmail.includes('@')) throw new Error('Valid email দিন।');
  const loginPassword = password?.trim() || generateTempPassword();
  if (loginPassword.length < 6) throw new Error('Password অন্তত ৬ অক্ষর হতে হবে।');

  if (isDemoLoginEnabled) {
    return { status: 'demo', email: loginEmail, password: loginPassword, uid: `demo-${loginEmail}` };
  }

  const secondary = initializeApp(firebaseConfig, `provision-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondary);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, loginEmail, loginPassword);
    const uid = credential.user.uid;
    await signOut(secondaryAuth);
    return { status: 'created', email: loginEmail, password: loginPassword, uid };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/email-already-in-use') {
      return { status: 'already_exists', email: loginEmail };
    }
    throw error;
  } finally {
    await deleteApp(secondary);
  }
}

export async function sendLoginResetEmail(email: string): Promise<void> {
  const loginEmail = email.trim().toLowerCase();
  if (!loginEmail.includes('@')) throw new Error('Valid email দিন।');
  if (isDemoLoginEnabled) return;
  await sendPasswordResetEmail(auth, loginEmail);
}
