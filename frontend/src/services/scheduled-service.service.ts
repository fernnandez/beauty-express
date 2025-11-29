import { api } from '../config/api';
import type {
  ScheduledService,
  UpdateScheduledServiceDto,
} from '../types';

export const scheduledServiceService = {
  findAll: async (): Promise<ScheduledService[]> => {
    const response = await api.get<ScheduledService[]>('/scheduled-services');
    return response.data;
  },

  findById: async (id: string): Promise<ScheduledService> => {
    const response = await api.get<ScheduledService>(
      `/scheduled-services/${id}`,
    );
    return response.data;
  },

  findByAppointmentId: async (
    appointmentId: string,
  ): Promise<ScheduledService[]> => {
    const response = await api.get<ScheduledService[]>(
      `/scheduled-services/appointment/${appointmentId}`,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateScheduledServiceDto,
  ): Promise<ScheduledService> => {
    const response = await api.put<ScheduledService>(
      `/scheduled-services/${id}`,
      data,
    );
    return response.data;
  },

  complete: async (id: string): Promise<ScheduledService> => {
    const response = await api.put<ScheduledService>(
      `/scheduled-services/${id}/complete`,
    );
    return response.data;
  },

  cancel: async (id: string): Promise<ScheduledService> => {
    const response = await api.put<ScheduledService>(
      `/scheduled-services/${id}/cancel`,
    );
    return response.data;
  },
};

