import { api } from '../config/api';
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '../types';

export const appointmentService = {
  findAll: async (date?: string): Promise<Appointment[]> => {
    const params = date ? { date } : {};
    const response = await api.get<Appointment[]>('/appointments', {
      params,
    });
    return response.data;
  },

  findById: async (id: string): Promise<Appointment> => {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  create: async (data: CreateAppointmentDto): Promise<Appointment> => {
    const response = await api.post<Appointment>('/appointments', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateAppointmentDto,
  ): Promise<Appointment> => {
    const response = await api.put<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  complete: async (id: string): Promise<Appointment> => {
    const response = await api.put<Appointment>(`/appointments/${id}/complete`);
    return response.data;
  },

  cancel: async (id: string): Promise<Appointment> => {
    const response = await api.put<Appointment>(`/appointments/${id}/cancel`);
    return response.data;
  },

  getTotalPrice: async (id: string): Promise<number> => {
    const response = await api.get<{ totalPrice: number }>(
      `/appointments/${id}/total-price`,
    );
    return response.data.totalPrice;
  },
};
