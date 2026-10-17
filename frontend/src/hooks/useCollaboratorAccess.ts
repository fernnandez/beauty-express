import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collaboratorAccessService,
  type GrantAccessDto,
  type UpdateAccessDto,
} from "../services/collaborator-access.service";

const accessKey = (collaboratorId: string) => [
  "collaborator-access",
  collaboratorId,
];

export const useCollaboratorAccess = (collaboratorId?: string) => {
  return useQuery({
    queryKey: accessKey(collaboratorId ?? ""),
    queryFn: () => collaboratorAccessService.getStatus(collaboratorId as string),
    enabled: Boolean(collaboratorId),
  });
};

export const useGrantCollaboratorAccess = (collaboratorId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: GrantAccessDto) =>
      collaboratorAccessService.grant(collaboratorId, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(accessKey(collaboratorId), data);
    },
  });
};

export const useUpdateCollaboratorAccess = (collaboratorId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateAccessDto) =>
      collaboratorAccessService.update(collaboratorId, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(accessKey(collaboratorId), data);
    },
  });
};

export const useRevokeCollaboratorAccess = (collaboratorId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => collaboratorAccessService.revoke(collaboratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessKey(collaboratorId) });
    },
  });
};
