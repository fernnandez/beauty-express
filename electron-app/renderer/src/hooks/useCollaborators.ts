import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collaboratorService } from "../services/collaborator.service";
import type { CreateCollaboratorDto, UpdateCollaboratorDto } from "../types";

export const useCollaborators = (search?: string) => {
  return useQuery({
    queryKey: ["collaborators", search],
    queryFn: () => collaboratorService.findAll(search),
  });
};

export const useCollaborator = (id: string) => {
  return useQuery({
    queryKey: ["collaborators", id],
    queryFn: () => collaboratorService.findById(id),
    enabled: !!id,
  });
};

export const useCreateCollaborator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollaboratorDto) =>
      collaboratorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
    },
  });
};

export const useUpdateCollaborator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCollaboratorDto }) =>
      collaboratorService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
      queryClient.invalidateQueries({
        queryKey: ["collaborators", variables.id],
      });
    },
  });
};

export const useDeleteCollaborator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => collaboratorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
    },
  });
};
