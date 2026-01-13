import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduledServiceService } from "../services/scheduled-service.service";
import type {
  CreateScheduledServiceDto,
  UpdateScheduledServiceDto,
} from "../types";

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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      // Invalida a query específica do appointment que contém este serviço
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

export const useCancelScheduledService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scheduledServiceService.cancel(id),
    onSuccess: async (data) => {
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
