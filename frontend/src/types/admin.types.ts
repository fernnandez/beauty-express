import type { FinancialReport } from '../services/financial-report.service';
import type { UserRole } from './auth.types';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
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

export type TenantFinancialReport = FinancialReport;

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
  activeTenants: number;
  appointmentsToday: number;
  revenueThisMonth: number;
  pendingCommissions: number;
  byTenant: TenantDashboardRow[];
}

export interface CreateTenantDto {
  slug: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  isActive?: boolean;
}

export interface CreateAdminUserDto {
  email: string;
  password: string;
  role: Exclude<UserRole, 'super_admin'>;
  tenantId: string;
}

export interface UpdateAdminUserDto {
  email?: string;
  password?: string;
  role?: Exclude<UserRole, 'super_admin'>;
  tenantId?: string;
  isActive?: boolean;
}
