import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/appointment.service';
import type { CreateAppointmentDto, UpdateAppointmentDto } from '../types';

export const useAppointments = (date?: string) => {
  return useQuery({
    queryKey: ['appointments', date],
    queryFn: () => appointmentService.findAll(date),
  });
};

export const useAppointment = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentService.findById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentDto) =>
      appointmentService.create(data),
    onSuccess: async (newAppointment) => {
      // Invalida todas as queries de appointments (com ou sem filtro de data)
      // exact: false garante que invalida todas as variações da query key
      queryClient.invalidateQueries({ 
        queryKey: ['appointments'],
        exact: false 
      });
      
      // Atualiza o cache imediatamente para a query sem filtro
      queryClient.setQueryData(['appointments', undefined], (old: any) => {
        if (!old) return [newAppointment];
        // Verifica se já existe para evitar duplicatas
        const exists = old.some((apt: any) => apt.id === newAppointment.id);
        if (exists) return old;
        return [...old, newAppointment];
      });
      
      // Força refetch para garantir que está atualizado
      await queryClient.refetchQueries({ 
        queryKey: ['appointments'],
        exact: false 
      });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentDto }) =>
      appointmentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
    },
  });
};

export const useCompleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', id] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', id] });
    },
  });
};
