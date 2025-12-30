import type { Commission } from '../types';

export const commissionService = {
  findAll: async (filters?: {
    paid?: boolean;
    collaboratorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Commission[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.commissions.getAll(filters);
  },

  findById: async (id: string): Promise<Commission> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.commissions.getById(id);
  },

  calculateForScheduledService: async (scheduledServiceId: string): Promise<Commission> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.commissions.calculateForScheduledService(scheduledServiceId);
  },

  calculateForAppointment: async (appointmentId: string): Promise<Commission[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.commissions.calculateForAppointment(appointmentId);
  },

  findByCollaborator: async (collaboratorId: string): Promise<Commission[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.commissions.findByCollaborator(collaboratorId);
  },

  findPending: async (): Promise<Commission[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.commissions.findPending();
  },

  markAsPaid: async (ids: string[]): Promise<Commission[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.commissions.markAsPaid(ids);
  },

  markAsUnpaid: async (ids: string[]): Promise<Commission[]> => {
    if (!window.electronAPI) {
      throw new Error('electronAPI não está disponível');
    }
    return window.electronAPI.commissions.markAsUnpaid(ids);
  },
};
