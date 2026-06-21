import { Injectable, Scope } from '@nestjs/common';
import {
  endOfDay,
  formatDateToString,
  startOfDay,
} from '../../utils/date.util';
import { ScheduledServiceStatus } from '../entities/scheduled-service.entity';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { TenantContextService } from './tenant-context.service';

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

@Injectable({ scope: Scope.REQUEST })
export class FinancialReportService {
  constructor(
    private scheduledServiceRepository: ScheduledServiceRepository,
    private commissionRepository: CommissionRepository,
    private tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  async getReportForPeriod(
    startDate: string,
    endDate: string,
  ): Promise<FinancialReport> {
    const tenantId = this.getTenantId();
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    const scheduledServices = await this.scheduledServiceRepository
      .createQueryBuilder('scheduledService')
      .leftJoinAndSelect('scheduledService.appointment', 'appointment')
      .where('scheduledService.tenantId = :tenantId', { tenantId })
      .andWhere('appointment.date BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      })
      .getMany();

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

    const paidCommissions = await this.commissionRepository.findByFilters(
      tenantId,
      {
        paid: true,
        startDate: start,
        endDate: end,
      },
    );

    const totalCommissionsPaid = paidCommissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0,
    );

    const allCommissions = await this.commissionRepository.findByFilters(
      tenantId,
      {
        startDate: start,
        endDate: end,
      },
    );

    const totalCommissionsExpected = allCommissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0,
    );

    const netAmount = totalPaid - totalCommissionsPaid;
    const netAmountExpected = totalPaid - totalCommissionsExpected;

    return {
      totalScheduled,
      totalPaid,
      totalUnpaid,
      totalCommissionsPaid,
      totalCommissionsExpected,
      netAmount,
      netAmountExpected,
      period: {
        startDate: formatDateToString(start),
        endDate: formatDateToString(end),
      },
    };
  }

  async getMonthlyReport(
    year: number,
    month: number,
  ): Promise<FinancialReport> {
    const startDate = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    return this.getReportForPeriod(
      formatDateToString(startDate),
      formatDateToString(lastDay),
    );
  }
}
