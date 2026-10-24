import { getCurrentActor } from './actor';
import type { UserRole } from '../types';

/**
 * Principal and Managing Partner are the same office.
 * Permission checks should use isSuperAdminRole instead of duplicating either role.
 * The reserved `super_admin` login (hardcoded emails in auth.ts) is included so it
 * keeps the same powers when it is acting as that office.
 */
export const SUPER_ADMIN_ROLES = ['principal', 'managing_partner', 'super_admin'] as const;

/** Roles that can be created from the user-management screen. */
export const ASSIGNABLE_ROLES = [
  'teacher',
  'accounts',
  'principal',
  'managing_partner',
  'director',
] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const USER_ROLES: UserRole[] = [
  'guardian',
  'teacher',
  'accounts',
  'principal',
  'managing_partner',
  'director',
  'super_admin',
];

/** Demo portal ids. These are not email addresses. */
export const DEMO_PORTAL_LOGINS: { role: UserRole; label: string; userId: string }[] = [
  { role: 'guardian', label: 'Guardian', userId: 'ANS-GRD-001' },
  { role: 'teacher', label: 'Teacher', userId: 'EMP-TCH-001' },
  { role: 'accounts', label: 'Accounts', userId: 'EMP-ACC-001' },
  { role: 'principal', label: 'Principal', userId: 'EMP-PRN-001' },
  { role: 'managing_partner', label: 'Managing Partner', userId: 'EMP-MP-001' },
  { role: 'director', label: 'Director', userId: 'EMP-DIR-001' },
];

export function isUserRole(value: string | null | undefined): value is UserRole {
  return Boolean(value && (USER_ROLES as string[]).includes(value));
}

export function isAssignableRole(value: string | null | undefined): value is AssignableRole {
  return Boolean(value && (ASSIGNABLE_ROLES as readonly string[]).includes(value));
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === 'principal' || role === 'managing_partner' || role === 'super_admin';
}

export function isViewOnlyRole(role: string | null | undefined): boolean {
  return role === 'director';
}

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'guardian':
      return 'Guardian';
    case 'teacher':
      return 'Teacher';
    case 'accounts':
      return 'Accounts';
    case 'principal':
      return 'Principal';
    case 'managing_partner':
      return 'Managing Partner';
    case 'director':
      return 'Director';
    case 'super_admin':
      return 'Super Admin';
    default:
      return 'User';
  }
}

export function getSessionRole(): UserRole {
  const stored = localStorage.getItem('userRole');
  return isUserRole(stored) ? stored : 'guardian';
}

export function sessionCanMutate(): boolean {
  return !isViewOnlyRole(getSessionRole());
}

/** Block every create, edit, delete, approve, import, payment, and settings write for Director. */
export function assertCanMutate(): void {
  if (!sessionCanMutate()) {
    throw new Error('Director access is view-only. This action is not allowed.');
  }
}

export function assertCanAssignRoles(targetEmail: string): void {
  if (!isSuperAdminRole(getSessionRole())) {
    throw new Error('Only a Principal or Managing Partner can assign roles.');
  }

  const actorEmail = getCurrentActor().email.trim().toLowerCase();
  const target = targetEmail.trim().toLowerCase();
  if (actorEmail && target && actorEmail === target) {
    throw new Error('You cannot assign or change your own role.');
  }
}

export function demoPortalForUserId(userId: string) {
  const key = userId.trim().toLowerCase();
  return DEMO_PORTAL_LOGINS.find((entry) => entry.userId.toLowerCase() === key) ?? null;
}
