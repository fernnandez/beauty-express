import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  COMMISSIONS_PAGE_SIZE,
  commissionService,
} from '../services/commission.service';

export const useCommissions = (
  filters?: {
    paid?: boolean;
    startDate?: string;
    endDate?: string;
    collaboratorIds?: string[];
    search?: string;
    page?: number;
    limit?: number;
  },
  enabled = true,
) => {
  return useQuery({
    queryKey: ['commissions', filters],
    queryFn: () => commissionService.findAll(filters),
    enabled,
    placeholderData: (previousData) => previousData,
  });
};

export { COMMISSIONS_PAGE_SIZE };

export const useMarkCommissionsAsPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commissionIds: string[]) =>
      commissionService.markAsPaid(commissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
};

export const useMarkCommissionsAsUnpaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commissionIds: string[]) =>
      commissionService.markAsUnpaid(commissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
};
