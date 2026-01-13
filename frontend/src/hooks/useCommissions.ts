import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commissionService } from '../services/commission.service';

export const useCommissions = (filters?: {
  paid?: boolean;
  startDate?: string;
  endDate?: string;
  collaboratorId?: string;
}) => {
  return useQuery({
    queryKey: ['commissions', filters],
    queryFn: () => commissionService.findAll(filters),
  });
};

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
