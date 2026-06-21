import { useQuery } from '@tanstack/react-query';
import { financialReportService } from '../services/financial-report.service';

export function useFinancialReports(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['financialReports', startDate, endDate],
    queryFn: () => financialReportService.getReport(startDate, endDate),
    enabled: Boolean(startDate && endDate),
  });
}
