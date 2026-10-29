import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, isReservedSuperAdminEmail, waitForAuthUser } from './auth';
import { getCurrentActor, getCurrentActorLabel } from './actor';
import { assertCanAssignRoles, isAssignableRole } from './permissions';
import { provisionLoginAccount, type LoginProvisionResult } from './provisionAuth';
import { omitUndefined, toIsoString } from './utils';
import type { StaffAccessGrant, StaffAccessRole } from '../types';

const ACCESS_COLLECTION = 'staffAccess';
const LOCAL_ACCESS_KEY = 'an-noor-staff-access';

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

export function accessDocId(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeGrant(raw: Partial<StaffAccessGrant>, fallbackId?: string): StaffAccessGrant {
  const email = (raw.email ?? fallbackId ?? '').trim().toLowerCase();
  return {
    id: raw.id || email,
    email,
    name: raw.name?.trim() || email,
    role: isAssignableRole(raw.role) ? raw.role : 'accounts',
    status: raw.status === 'revoked' ? 'revoked' : 'active',
    grantedBy: raw.grantedBy || 'Principal Office',
    grantedByEmail: raw.grantedByEmail,
    authUid: raw.authUid,
    grantedAt: toIsoString(raw.grantedAt),
    revokedBy: raw.revokedBy,
    revokedAt: raw.revokedAt ? toIsoString(raw.revokedAt) : undefined,
    note: raw.note,
  };
}

export function peekStaffAccessByEmail(email: string): StaffAccessGrant | null {
  const id = accessDocId(email);
  if (!id) return null;
  const grants = readLocal<StaffAccessGrant[]>(LOCAL_ACCESS_KEY, []);
  const grant = grants.find((item) => accessDocId(item.email) === id || item.id === id);
  return grant ? normalizeGrant(grant) : null;
}

export async function fetchStaffAccessList(): Promise<StaffAccessGrant[]> {
  if (isDemoLoginEnabled) {
    return readLocal<StaffAccessGrant[]>(LOCAL_ACCESS_KEY, [])
      .map((item) => normalizeGrant(item))
      .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, ACCESS_COLLECTION)));
  return snapshot.docs
    .map((document) => normalizeGrant(document.data() as StaffAccessGrant, document.id))
    .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
}

export async function fetchStaffAccessByEmail(email: string): Promise<StaffAccessGrant | null> {
  const id = accessDocId(email);
  if (!id) return null;

  if (isDemoLoginEnabled) {
    return peekStaffAccessByEmail(id);
  }

  await waitForAuthUser();
  const snapshot = await getDoc(doc(db, ACCESS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return normalizeGrant(snapshot.data() as StaffAccessGrant, snapshot.id);
}

async function persistGrant(grant: StaffAccessGrant): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocal<StaffAccessGrant[]>(LOCAL_ACCESS_KEY, []);
    const index = existing.findIndex((item) => accessDocId(item.email) === grant.id || item.id === grant.id);
    if (index >= 0) existing[index] = grant;
    else existing.push(grant);
    writeLocal(LOCAL_ACCESS_KEY, existing);
    return;
  }

  await waitForAuthUser();
  await setDoc(doc(db, ACCESS_COLLECTION, grant.id), omitUndefined({
    ...grant,
    grantedAt: grant.grantedAt,
    updatedAt: serverTimestamp(),
  }), { merge: true });
}

async function mirrorRoleOnUser(uid: string | undefined, grant: StaffAccessGrant): Promise<void> {
  if (!uid || isDemoLoginEnabled) return;
  await setDoc(doc(db, 'users', uid), omitUndefined({
    email: grant.email,
    name: grant.name,
    role: grant.status === 'active' ? grant.role : 'revoked',
    updatedAt: serverTimestamp(),
  }), { merge: true });
}

export async function grantStaffAccess(input: {
  email: string;
  name: string;
  role: StaffAccessRole;
  note?: string;
  password?: string;
}): Promise<{ grant: StaffAccessGrant; login: LoginProvisionResult }> {
  const email = accessDocId(input.email);
  if (!email || !email.includes('@')) {
    throw new Error('Valid email address দিন।');
  }
  if (!isAssignableRole(input.role)) {
    throw new Error('That role cannot be assigned.');
  }
  if (isReservedSuperAdminEmail(email)) {
    throw new Error('This email is reserved and cannot be assigned a role.');
  }
  assertCanAssignRoles(email);

  const name = input.name.trim() || email;
  const actor = getCurrentActor();
  const existing = await fetchStaffAccessByEmail(email);
  const now = new Date().toISOString();
  const login = await provisionLoginAccount(email, input.password);

  const grant: StaffAccessGrant = {
    id: email,
    email,
    name,
    role: input.role,
    status: 'active',
    grantedBy: getCurrentActorLabel('Principal Office'),
    grantedByEmail: actor.email || undefined,
    authUid: login.uid || existing?.authUid,
    grantedAt: existing?.grantedAt && existing.status === 'active' ? existing.grantedAt : now,
    note: input.note?.trim() || undefined,
  };

  await persistGrant(grant);
  await mirrorRoleOnUser(grant.authUid, grant);
  return { grant, login };
}

export async function grantAccountsAccess(input: {
  email: string;
  name: string;
  note?: string;
  password?: string;
}): Promise<{ grant: StaffAccessGrant; login: LoginProvisionResult }> {
  return grantStaffAccess({ ...input, role: 'accounts' });
}

export async function setStaffLoginPassword(
  email: string,
  password?: string,
): Promise<LoginProvisionResult> {
  assertCanAssignRoles(email);
  const grant = await fetchStaffAccessByEmail(email);
  if (!grant || grant.status !== 'active') {
    throw new Error('Active access grant পাওয়া যায়নি।');
  }
  const login = await provisionLoginAccount(grant.email, password);
  if (login.uid && login.uid !== grant.authUid) {
    const updated = { ...grant, authUid: login.uid };
    await persistGrant(updated);
    await mirrorRoleOnUser(login.uid, updated);
  }
  return login;
}

export async function setAccountsLoginPassword(
  email: string,
  password?: string,
): Promise<LoginProvisionResult> {
  return setStaffLoginPassword(email, password);
}

export async function revokeStaffAccess(email: string): Promise<StaffAccessGrant> {
  const id = accessDocId(email);
  assertCanAssignRoles(id);
  const existing = await fetchStaffAccessByEmail(id);
  if (!existing) throw new Error('Access grant পাওয়া যায়নি।');
  if (existing.status === 'revoked') throw new Error('Access already revoked.');

  const updated: StaffAccessGrant = {
    ...existing,
    status: 'revoked',
    revokedBy: getCurrentActorLabel('Principal Office'),
    revokedAt: new Date().toISOString(),
  };

  await persistGrant(updated);
  await mirrorRoleOnUser(updated.authUid, updated);
  return updated;
}
