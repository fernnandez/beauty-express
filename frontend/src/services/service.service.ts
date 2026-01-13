import { api } from '../config/api';
import type { Service, CreateServiceDto, UpdateServiceDto } from '../types';

export const serviceService = {
  findAll: async (search?: string): Promise<Service[]> => {
    const params = search ? { search } : {};
    const response = await api.get<Service[]>('/services', { params });
    return response.data;
  },

  create: async (data: CreateServiceDto): Promise<Service> => {
    const response = await api.post<Service>('/services', data);
    return response.data;
  },

  update: async (id: string, data: UpdateServiceDto): Promise<Service> => {
    const response = await api.put<Service>(`/services/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};

