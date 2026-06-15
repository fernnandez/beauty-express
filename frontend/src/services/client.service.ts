import { api } from "../config/api";
import type { Client, CreateClientDto, UpdateClientDto } from "../types";

export const clientService = {
  findAll: async (search?: string): Promise<Client[]> => {
    const params = search ? { search } : {};
    const response = await api.get<Client[]>("/clients", { params });
    return response.data;
  },

  create: async (data: CreateClientDto): Promise<Client> => {
    const response = await api.post<Client>("/clients", data);
    return response.data;
  },

  update: async (id: string, data: UpdateClientDto): Promise<Client> => {
    const response = await api.put<Client>(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};
