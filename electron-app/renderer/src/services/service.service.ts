import type {
  Service,
  CreateServiceDto,
  UpdateServiceDto,
} from '../types';

export const serviceService = {
  findAll: async (search?: string): Promise<Service[]> => {
    return window.electronAPI.services.getAll(search);
  },

  findById: async (id: string): Promise<Service> => {
    return window.electronAPI.services.getById(id);
  },

  create: async (data: CreateServiceDto): Promise<Service> => {
    return window.electronAPI.services.create(data);
  },

  update: async (id: string, data: UpdateServiceDto): Promise<Service> => {
    return window.electronAPI.services.update(id, data);
  },

  delete: async (id: string): Promise<void> => {
    return window.electronAPI.services.delete(id);
  },
};

