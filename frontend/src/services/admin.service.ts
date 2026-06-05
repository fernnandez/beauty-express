import { adminApi } from '../config/admin-api';
import type {
  AdminUser,
  CreateAdminUserDto,
  CreateTenantDto,
  DashboardStats,
  Tenant,
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
};
