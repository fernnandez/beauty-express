import { api } from "../config/api";
import type {
  Collaborator,
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from "../types";

export const collaboratorService = {
  findAll: async (search?: string): Promise<Collaborator[]> => {
    const params = search ? { search } : {};
    const response = await api.get<Collaborator[]>("/collaborators", { params });
    return response.data;
  },

  create: async (data: CreateCollaboratorDto): Promise<Collaborator> => {
    const response = await api.post<Collaborator>("/collaborators", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateCollaboratorDto
  ): Promise<Collaborator> => {
    const response = await api.put<Collaborator>(`/collaborators/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/collaborators/${id}`);
  },
};
