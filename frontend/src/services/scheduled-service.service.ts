import { api } from '../config/api';
import type {
  CreateScheduledServiceDto,
  ScheduledService,
  UpdateScheduledServiceDto,
} from '../types';

export const scheduledServiceService = {
  create: async (
    appointmentId: string,
    data: CreateScheduledServiceDto,
  ): Promise<ScheduledService> => {
    const response = await api.post<ScheduledService>(
      `/scheduled-services/appointment/${appointmentId}`,
      data,
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

  cancel: async (id: string): Promise<ScheduledService> => {
    const response = await api.put<ScheduledService>(
      `/scheduled-services/${id}/cancel`,
    );
    return response.data;
  },
};

