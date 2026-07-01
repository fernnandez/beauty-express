import { api } from '../config/api';
import type { CommissionListResponse } from '../types';

export const COMMISSIONS_PAGE_SIZE = 50;

export const commissionService = {
  findAll: async (filters?: {
    paid?: boolean;
    startDate?: string;
    endDate?: string;
    collaboratorIds?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CommissionListResponse> => {
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
    filters?.collaboratorIds?.forEach((collaboratorId) => {
      params.append('collaboratorId', collaboratorId);
    });
    if (filters?.search) {
      params.append('search', filters.search);
    }
    params.append('page', String(filters?.page ?? 1));
    params.append('limit', String(filters?.limit ?? COMMISSIONS_PAGE_SIZE));

    const queryString = params.toString();
    const url = `/commissions?${queryString}`;
    const response = await api.get<CommissionListResponse>(url);
    return response.data;
  },

  markAsPaid: async (commissionIds: string[]) => {
    const response = await api.put('/commissions/mark-as-paid', {
      commissionIds,
    });
    return response.data;
  },

  markAsUnpaid: async (commissionIds: string[]) => {
    const response = await api.put(
      '/commissions/mark-as-unpaid',
      {
        commissionIds,
      },
    );
    return response.data;
  },
};
