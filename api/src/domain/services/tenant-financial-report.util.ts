import {
  endOfDay,
  formatDateToString,
  startOfDay,
} from '../../utils/date.util';
import { Commission } from '../entities/commission.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';

export interface TenantFinancialReport {
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

export function buildTenantFinancialReport(
  scheduledServices: ScheduledService[],
  paidCommissions: Commission[],
  allCommissions: Commission[],
  periodStart: Date,
  periodEnd: Date,
): TenantFinancialReport {
  let totalScheduled = 0;
  let totalPaid = 0;
  let totalUnpaid = 0;

  for (const service of scheduledServices) {
    const price = Number(service.price);
    totalScheduled += price;

    if (service.status === ScheduledServiceStatus.COMPLETED) {
      totalPaid += price;
    } else if (service.status === ScheduledServiceStatus.PENDING) {
      totalUnpaid += price;
    }
  }

  const totalCommissionsPaid = paidCommissions.reduce(
    (sum, commission) => sum + Number(commission.amount),
    0,
  );

  const totalCommissionsExpected = allCommissions.reduce(
    (sum, commission) => sum + Number(commission.amount),
    0,
  );

  return {
    totalScheduled,
    totalPaid,
    totalUnpaid,
    totalCommissionsPaid,
    totalCommissionsExpected,
    netAmount: totalPaid - totalCommissionsPaid,
    netAmountExpected: totalPaid - totalCommissionsExpected,
    period: {
      startDate: formatDateToString(periodStart),
      endDate: formatDateToString(periodEnd),
    },
  };
}

export function getMonthPeriod(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  return {
    start: startOfDay(startDate),
    end: endOfDay(lastDay),
  };
}
