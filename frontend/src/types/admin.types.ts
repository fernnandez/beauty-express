import type { UserRole } from './auth.types';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
  tenant?: Tenant | null;
}

export interface DashboardStats {
  tenants: number;
  users: number;
  collaborators: number;
  services: number;
  appointments: number;
}

export interface CreateTenantDto {
  slug: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateTenantDto {
  name?: string;
  isActive?: boolean;
}

export interface CreateAdminUserDto {
  email: string;
  password: string;
  role: Exclude<UserRole, 'super_admin'>;
  tenantId: string;
}
