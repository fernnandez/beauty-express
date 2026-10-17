import type { UserRole } from '../../types/auth.types';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  collaborator: 'Colaborador',
};

export const OPERATIONAL_ROLES: Array<{
  value: Exclude<UserRole, 'super_admin'>;
  label: string;
}> = [
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'collaborator', label: ROLE_LABELS.collaborator },
];
