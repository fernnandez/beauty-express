import { useQuery } from '@tanstack/react-query';
import { financialReportService } from '../services/financial-report.service';

export function useFinancialReports(year: number, month: number) {
  return useQuery({
    queryKey: ['financialReports', year, month],
    queryFn: () => financialReportService.getMonthly(year, month),
    enabled: year > 0 && month > 0 && month <= 12,
  });
}

