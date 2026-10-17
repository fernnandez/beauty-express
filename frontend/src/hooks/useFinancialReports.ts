import { useQuery } from '@tanstack/react-query';
import {
  financialReportService,
  type ReportGranularity,
} from '../services/financial-report.service';

export function useFinancialReports(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['financialReports', startDate, endDate],
    queryFn: () => financialReportService.getReport(startDate, endDate),
    enabled: Boolean(startDate && endDate),
  });
}

export function useReportTimeseries(granularity: ReportGranularity) {
  return useQuery({
    queryKey: ['reportTimeseries', granularity],
    queryFn: () => financialReportService.getTimeseries(granularity),
  });
}

export function useTopServices(granularity: ReportGranularity, limit = 5) {
  return useQuery({
    queryKey: ['topServices', granularity, limit],
    queryFn: () => financialReportService.getTopServices(granularity, limit),
  });
}
