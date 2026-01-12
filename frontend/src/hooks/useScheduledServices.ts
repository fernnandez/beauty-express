import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduledServiceService } from "../services/scheduled-service.service";
import type {
  CreateScheduledServiceDto,
  UpdateScheduledServiceDto,
} from "../types";

export const useScheduledServices = () => {
  return useQuery({
    queryKey: ["scheduled-services"],
    queryFn: () => scheduledServiceService.findAll(),
  });
};

export const useScheduledService = (id: string) => {
  return useQuery({
    queryKey: ["scheduled-services", id],
    queryFn: () => scheduledServiceService.findById(id),
    enabled: !!id,
  });
};

export const useScheduledServicesByAppointment = (appointmentId: string) => {
  return useQuery({
    queryKey: ["scheduled-services", "appointment", appointmentId],
    queryFn: () => scheduledServiceService.findByAppointmentId(appointmentId),
    enabled: !!appointmentId,
  });
};

export const useCreateScheduledService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      data,
    }: {
      appointmentId: string;
      data: CreateScheduledServiceDto;
    }) => scheduledServiceService.create(appointmentId, data),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-services"] });
      queryClient.invalidateQueries({
        queryKey: ["scheduled-services", "appointment", data.appointmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (data.appointmentId) {
        queryClient.invalidateQueries({
          queryKey: ["appointments", data.appointmentId],
        });
        // Força refetch imediato para garantir dados atualizados
        await queryClient.refetchQueries({
          queryKey: ["appointments", data.appointmentId],
        });
      }
    },
  });
};

export const useUpdateScheduledService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateScheduledServiceDto;
    }) => scheduledServiceService.update(id, data),
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-services"] });
      queryClient.invalidateQueries({
        queryKey: ["scheduled-services", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      // Invalida a query específica do appointment que contém este serviço
      if (data.appointmentId) {
        queryClient.invalidateQueries({
          queryKey: ["appointments", data.appointmentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["scheduled-services", "appointment", data.appointmentId],
        });
        // Força refetch imediato para garantir dados atualizados
        await queryClient.refetchQueries({
          queryKey: ["appointments", data.appointmentId],
        });
      }
    },
  });
};

export const useCompleteScheduledService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scheduledServiceService.complete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-services"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-services", data.id] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      // Invalida a query específica do appointment que contém este serviço
      if (data.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["appointments", data.appointmentId] });
      }
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });
};

export const useCancelScheduledService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scheduledServiceService.cancel(id),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-services"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-services", data.id] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      // Invalida a query específica do appointment que contém este serviço
      if (data.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["appointments", data.appointmentId] });
        // Força refetch imediato para garantir dados atualizados
        await queryClient.refetchQueries({
          queryKey: ["appointments", data.appointmentId],
        });
      }
    },
  });
};
