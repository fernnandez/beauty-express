import { api } from '../config/api';
import type { Commission } from '../types';

export const commissionService = {
  findAll: async (filters?: {
    paid?: boolean;
    startDate?: string;
    endDate?: string;
    collaboratorId?: string;
  }): Promise<Commission[]> => {
    const params = new URLSearchParams();
    
    if (filters?.paid !== undefined) {
      params.append('paid', filters.paid.toString());
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.collaboratorId) {
      params.append('collaboratorId', filters.collaboratorId);
    }

    const queryString = params.toString();
    const url = queryString ? `/commissions?${queryString}` : '/commissions';
    const response = await api.get<Commission[]>(url);
    return response.data;
  },

  markAsPaid: async (commissionIds: string[]): Promise<Commission[]> => {
    const response = await api.put<Commission[]>('/commissions/mark-as-paid', {
      commissionIds,
    });
    return response.data;
  },

  markAsUnpaid: async (commissionIds: string[]): Promise<Commission[]> => {
    const response = await api.put<Commission[]>(
      '/commissions/mark-as-unpaid',
      {
        commissionIds,
      },
    );
    return response.data;
  },
};
