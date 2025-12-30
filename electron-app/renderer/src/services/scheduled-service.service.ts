import type { UpdateScheduledServiceDto, ScheduledService } from '../types';

export const scheduledServiceService = {
  findAll: async (): Promise<ScheduledService[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.scheduledServices.getAll();
  },

  findById: async (id: string): Promise<ScheduledService> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.scheduledServices.getById(id);
  },

  findByAppointmentId: async (appointmentId: string): Promise<ScheduledService[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.scheduledServices.findByAppointmentId(appointmentId);
  },

  update: async (id: string, data: UpdateScheduledServiceDto): Promise<ScheduledService> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.scheduledServices.update(id, data);
  },

  complete: async (id: string): Promise<ScheduledService> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.scheduledServices.complete(id);
  },

  cancel: async (id: string): Promise<ScheduledService> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.scheduledServices.cancel(id);
  },
};
