export type UserRole = 'guardian' | 'teacher' | 'accounts' | 'principal' | 'super_admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  avatar?: string;
}
