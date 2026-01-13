import { api } from '../config/api';

export interface FinancialReport {
  totalScheduled: number;
  totalPaid: number;
  totalUnpaid: number;
  totalCommissionsPaid: number;
  totalCommissionsExpected: number;
  netAmount: number;
  netAmountExpected: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export const financialReportService = {
  getMonthlyReport: async (
    year: number,
    month: number,
  ): Promise<FinancialReport> => {
    const response = await api.get<FinancialReport>(
      `/financial-reports/monthly?year=${year}&month=${month}`,
    );
    return response.data;
  },
};

