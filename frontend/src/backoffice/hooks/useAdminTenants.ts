import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import type { CreateTenantDto, UpdateTenantDto } from '../../types/admin.types';

export const useAdminTenants = () => {
  return useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => adminService.listTenants(),
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantDto) => adminService.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantDto }) =>
      adminService.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
};
