import type { FinancialReport } from '../types';

export const financialReportService = {
  getMonthly: async (year: number, month: number): Promise<FinancialReport> => {
    return window.electronAPI.reports.monthly(year, month);
  },
};

