import { adminApi } from '../config/admin-api';
import type { Appointment, Commission } from '../types';
import type {
  TenantCollaboratorsReport,
  AdminAuditLog,
  AdminUser,
  CreateAdminUserDto,
  CreateTenantDto,
  DashboardStats,
  Tenant,
  TenantCommissionsFilters,
  TenantDetail,
  TenantFinancialReport,
  UpdateAdminUserDto,
  UpdateTenantDto,
} from '../types/admin.types';

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await adminApi.get<DashboardStats>('/admin/dashboard/stats');
    return response.data;
  },

  listTenants: async (): Promise<Tenant[]> => {
    const response = await adminApi.get<Tenant[]>('/admin/tenants');
    return response.data;
  },

  getTenantDetail: async (id: string): Promise<TenantDetail> => {
    const response = await adminApi.get<TenantDetail>(`/admin/tenants/${id}`);
    return response.data;
  },

  getTenantAppointments: async (
    id: string,
    params?: { date?: string; startDate?: string; endDate?: string },
  ): Promise<Appointment[]> => {
    const response = await adminApi.get<Appointment[]>(
      `/admin/tenants/${id}/appointments`,
      { params },
    );
    return response.data;
  },

  getTenantCommissions: async (
    id: string,
    filters?: TenantCommissionsFilters,
  ): Promise<Commission[]> => {
    const response = await adminApi.get<Commission[]>(
      `/admin/tenants/${id}/commissions`,
      { params: filters },
    );
    return response.data;
  },

  getTenantSummary: async (
    id: string,
    year: number,
    month: number,
  ): Promise<TenantFinancialReport> => {
    const response = await adminApi.get<TenantFinancialReport>(
      `/admin/tenants/${id}/summary`,
      { params: { year, month } },
    );
    return response.data;
  },

  getTenantCollaborators: async (
    id: string,
  ): Promise<TenantCollaboratorsReport> => {
    const response = await adminApi.get<TenantCollaboratorsReport>(
      `/admin/tenants/${id}/collaborators`,
    );
    return response.data;
  },

  createTenant: async (dto: CreateTenantDto): Promise<Tenant> => {
    const response = await adminApi.post<Tenant>('/admin/tenants', dto);
    return response.data;
  },

  updateTenant: async (id: string, dto: UpdateTenantDto): Promise<Tenant> => {
    const response = await adminApi.patch<Tenant>(`/admin/tenants/${id}`, dto);
    return response.data;
  },

  listUsers: async (): Promise<AdminUser[]> => {
    const response = await adminApi.get<AdminUser[]>('/admin/users');
    return response.data;
  },

  createUser: async (dto: CreateAdminUserDto): Promise<AdminUser> => {
    const response = await adminApi.post<AdminUser>('/admin/users', dto);
    return response.data;
  },

  updateUser: async (id: string, dto: UpdateAdminUserDto): Promise<AdminUser> => {
    const response = await adminApi.patch<AdminUser>(`/admin/users/${id}`, dto);
    return response.data;
  },

  listAuditLogs: async (limit = 50): Promise<AdminAuditLog[]> => {
    const response = await adminApi.get<AdminAuditLog[]>('/admin/audit-logs', {
      params: { limit },
    });
    return response.data;
  },
};
