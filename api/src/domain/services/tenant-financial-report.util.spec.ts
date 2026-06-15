import { Commission } from '../entities/commission.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';
import { buildTenantFinancialReport } from './tenant-financial-report.util';

describe('buildTenantFinancialReport', () => {
  const periodStart = new Date('2026-06-01T03:00:00.000Z');
  const periodEnd = new Date('2026-07-01T02:59:59.999Z');

  it('should calculate totals from scheduled services and commissions', () => {
    const scheduledServices = [
      {
        price: 100,
        status: ScheduledServiceStatus.COMPLETED,
      },
      {
        price: 50,
        status: ScheduledServiceStatus.PENDING,
      },
      {
        price: 30,
        status: ScheduledServiceStatus.CANCELLED,
      },
    ] as ScheduledService[];

    const paidCommissions = [{ amount: 20 }] as Commission[];
    const allCommissions = [{ amount: 20 }, { amount: 10 }] as Commission[];

    const report = buildTenantFinancialReport(
      scheduledServices,
      paidCommissions,
      allCommissions,
      periodStart,
      periodEnd,
    );

    expect(report.totalScheduled).toBe(180);
    expect(report.totalPaid).toBe(100);
    expect(report.totalUnpaid).toBe(50);
    expect(report.totalCommissionsPaid).toBe(20);
    expect(report.totalCommissionsExpected).toBe(30);
    expect(report.netAmount).toBe(80);
    expect(report.netAmountExpected).toBe(70);
    expect(report.period.startDate).toBe('2026-06-01');
    expect(report.period.endDate).toBe('2026-06-30');
  });
});
