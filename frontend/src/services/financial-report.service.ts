import { api } from '../config/api';

export interface FinancialReport {
  totalScheduled: number;
  totalPaid: number;
  totalUnpaid: number;
  totalCommissionsPaid: number;
  totalCommissionsExpected: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  netAmount: number;
  netAmountExpected: number;
  netProfit: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export type ReportGranularity = "semester" | "year";

export interface MonthlyTimeseriesPoint {
  month: string;
  label: string;
  appointmentsCount: number;
  servicesCount: number;
  revenue: number;
  averageTicket: number;
}

export interface TopServiceItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  revenue: number;
}

export const financialReportService = {
  getReport: async (
    startDate: string,
    endDate: string,
  ): Promise<FinancialReport> => {
    const response = await api.get<FinancialReport>(
      `/financial-reports/period?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  },

  getMonthlyReport: async (
    year: number,
    month: number,
  ): Promise<FinancialReport> => {
    const response = await api.get<FinancialReport>(
      `/financial-reports/monthly?year=${year}&month=${month}`,
    );
    return response.data;
  },

  getTimeseries: async (
    granularity: ReportGranularity,
  ): Promise<MonthlyTimeseriesPoint[]> => {
    const response = await api.get<MonthlyTimeseriesPoint[]>(
      `/financial-reports/timeseries?granularity=${granularity}`,
    );
    return response.data;
  },

  getTopServices: async (
    granularity: ReportGranularity,
    limit = 5,
  ): Promise<TopServiceItem[]> => {
    const response = await api.get<TopServiceItem[]>(
      `/financial-reports/top-services?granularity=${granularity}&limit=${limit}`,
    );
    return response.data;
  },
};

