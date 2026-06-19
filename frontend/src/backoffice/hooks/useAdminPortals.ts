import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import type { CreatePortalDto, UpdatePortalDto } from '../../types/admin.types';

export const useAdminPortals = () => {
  return useQuery({
    queryKey: ['admin', 'portals'],
    queryFn: () => adminService.listPortals(),
  });
};

export const useCreatePortal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortalDto) => adminService.createPortal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portals'] });
    },
  });
};

export const useUpdatePortal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortalDto }) =>
      adminService.updatePortal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portals'] });
    },
  });
};
