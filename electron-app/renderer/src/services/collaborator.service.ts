import type {
  Collaborator,
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from '../types';

export const collaboratorService = {
  findAll: async (search?: string): Promise<Collaborator[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível. Certifique-se de que o preload foi carregado.');
    }
    return window.electronAPI.collaborators.getAll(search);
  },

  findById: async (id: string): Promise<Collaborator> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível. Certifique-se de que o preload foi carregado.');
    }
    return window.electronAPI.collaborators.getById(id);
  },

  create: async (data: CreateCollaboratorDto): Promise<Collaborator> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível. Certifique-se de que o preload foi carregado.');
    }
    if (!window.electronAPI.collaborators) {
      throw new Error('electronAPI.collaborators não está disponível. Verifique o preload.js.');
    }
    return window.electronAPI.collaborators.create(data);
  },

  update: async (
    id: string,
    data: UpdateCollaboratorDto,
  ): Promise<Collaborator> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível. Certifique-se de que o preload foi carregado.');
    }
    return window.electronAPI.collaborators.update(id, data);
  },

  delete: async (id: string): Promise<void> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível. Certifique-se de que o preload foi carregado.');
    }
    return window.electronAPI.collaborators.delete(id);
  },
};

