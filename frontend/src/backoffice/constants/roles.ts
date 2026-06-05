import type { UserRole } from '../../types/auth.types';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  staff: 'Operacional',
};

export const OPERATIONAL_ROLES: Array<{
  value: Exclude<UserRole, 'super_admin'>;
  label: string;
}> = [
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'manager', label: ROLE_LABELS.manager },
  { value: 'staff', label: ROLE_LABELS.staff },
];
