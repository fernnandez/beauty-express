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

export const useCommission = (id: string) => {
  return useQuery({
    queryKey: ['commissions', id],
    queryFn: () => commissionService.findById(id),
    enabled: !!id,
  });
};

export const useCommissionsByCollaborator = (collaboratorId: string) => {
  return useQuery({
    queryKey: ['commissions', 'collaborator', collaboratorId],
    queryFn: () => commissionService.findByCollaborator(collaboratorId),
    enabled: !!collaboratorId,
  });
};

export const useCalculateCommissionForScheduledService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduledServiceId: string) =>
      commissionService.calculateForScheduledService(scheduledServiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useCalculateCommissionsForAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) =>
      commissionService.calculateForAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const usePendingCommissions = () => {
  return useQuery({
    queryKey: ['commissions', 'pending'],
    queryFn: () => commissionService.findPending(),
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
