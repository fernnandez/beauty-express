import { api } from "../config/api";

export interface CollaboratorAccessStatus {
  hasAccess: boolean;
  userId: string | null;
  email: string | null;
  isActive: boolean | null;
}

export interface GrantAccessDto {
  email: string;
  password: string;
}

export interface UpdateAccessDto {
  email?: string;
  password?: string;
  isActive?: boolean;
}

export const collaboratorAccessService = {
  getStatus: async (
    collaboratorId: string,
  ): Promise<CollaboratorAccessStatus> => {
    const response = await api.get<CollaboratorAccessStatus>(
      `/collaborators/${collaboratorId}/access`,
    );
    return response.data;
  },

  grant: async (
    collaboratorId: string,
    dto: GrantAccessDto,
  ): Promise<CollaboratorAccessStatus> => {
    const response = await api.post<CollaboratorAccessStatus>(
      `/collaborators/${collaboratorId}/access`,
      dto,
    );
    return response.data;
  },

  update: async (
    collaboratorId: string,
    dto: UpdateAccessDto,
  ): Promise<CollaboratorAccessStatus> => {
    const response = await api.patch<CollaboratorAccessStatus>(
      `/collaborators/${collaboratorId}/access`,
      dto,
    );
    return response.data;
  },

  revoke: async (collaboratorId: string): Promise<void> => {
    await api.delete(`/collaborators/${collaboratorId}/access`);
  },
};
