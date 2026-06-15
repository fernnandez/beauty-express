import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientService } from "../services/client.service";
import type { CreateClientDto, UpdateClientDto } from "../types";

export const useClients = (
  search?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["clients", search],
    queryFn: () => clientService.findAll(search),
    enabled: options?.enabled ?? true,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientDto) => clientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      clientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
