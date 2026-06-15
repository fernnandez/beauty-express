import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import type { TenantCommissionsFilters } from '../../types/admin.types';

export const useAdminTenantDetail = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['admin', 'tenants', tenantId],
    queryFn: () => adminService.getTenantDetail(tenantId!),
    enabled: Boolean(tenantId),
  });
};

export const useAdminTenantAppointments = (
  tenantId: string | undefined,
  date?: string,
) => {
  return useQuery({
    queryKey: ['admin', 'tenants', tenantId, 'appointments', date],
    queryFn: () =>
      adminService.getTenantAppointments(tenantId!, date ? { date } : undefined),
    enabled: Boolean(tenantId),
  });
};

export const useAdminTenantCommissions = (
  tenantId: string | undefined,
  filters?: TenantCommissionsFilters,
) => {
  return useQuery({
    queryKey: ['admin', 'tenants', tenantId, 'commissions', filters],
    queryFn: () => adminService.getTenantCommissions(tenantId!, filters),
    enabled: Boolean(tenantId),
  });
};

export const useAdminTenantSummary = (
  tenantId: string | undefined,
  year: number,
  month: number,
) => {
  return useQuery({
    queryKey: ['admin', 'tenants', tenantId, 'summary', year, month],
    queryFn: () => adminService.getTenantSummary(tenantId!, year, month),
    enabled: Boolean(tenantId),
  });
};
