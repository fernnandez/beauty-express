import type { LoginBranding } from './branding.types';
import type { TenantSettings } from './tenant-settings.types';

export interface Portal {
  id: string;
  slug: string;
  host: string;
  loginBranding: LoginBranding;
  isActive: boolean;
  createdAt?: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  portalId: string;
  settings?: TenantSettings;
  portal?: Portal;
  isActive: boolean;
}

export interface TenantMetricsSnapshot {
  appointmentsToday: number;
  revenueThisMonth: number;
  pendingCommissions: number;
  collaborators: number;
  services: number;
  appointments: number;
}

export interface TenantDetail extends Tenant {
  metrics: TenantMetricsSnapshot;
}

export interface TenantDashboardRow {
  tenantId: string;
  tenantName: string;
  slug: string;
  isActive: boolean;
  appointmentsToday: number;
  revenueThisMonth: number;
  pendingCommissions: number;
  collaborators: number;
  services: number;
}

export interface TenantCommissionsFilters {
  paid?: boolean;
  startDate?: string;
  endDate?: string;
  collaboratorId?: string;
}

export type TenantFinancialReport = import('../services/financial-report.service').FinancialReport;

export interface AdminUser {
  id: string;
  email: string;
  role: import('./auth.types').UserRole;
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
  activeTenants: number;
  appointmentsToday: number;
  revenueThisMonth: number;
  pendingCommissions: number;
  byTenant: TenantDashboardRow[];
}

export interface CreatePortalDto {
  slug: string;
  host: string;
  loginBranding: LoginBranding;
  isActive?: boolean;
}

export interface UpdatePortalDto {
  slug?: string;
  host?: string;
  loginBranding?: Partial<LoginBranding>;
  isActive?: boolean;
}

export interface CreateTenantDto {
  slug: string;
  name: string;
  portalId: string;
  isActive?: boolean;
}

export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  portalId?: string;
  settings?: Partial<TenantSettings>;
  isActive?: boolean;
}

export interface CreateAdminUserDto {
  email: string;
  password: string;
  role: Exclude<import('./auth.types').UserRole, 'super_admin'>;
  tenantId: string;
}

export interface UpdateAdminUserDto {
  email?: string;
  password?: string;
  role?: Exclude<import('./auth.types').UserRole, 'super_admin'>;
  tenantId?: string;
  isActive?: boolean;
}
