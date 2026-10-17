import { Injectable, Scope } from '@nestjs/common';
import { DateTime } from 'luxon';
import {
  endOfDay,
  formatDateToString,
  startOfDay,
} from '../../utils/date.util';
import { AppointmentStatus } from '../entities/appointment.entity';
import { ScheduledServiceStatus } from '../entities/scheduled-service.entity';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ExpenseService } from './expense.service';
import { TenantContextService } from './tenant-context.service';

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

export interface MonthlyTimeseriesPoint {
  /** Mês de referência no formato yyyy-MM. */
  month: string;
  /** Rótulo curto, ex.: "jan/26". */
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

@Injectable({ scope: Scope.REQUEST })
export class FinancialReportService {
  constructor(
    private scheduledServiceRepository: ScheduledServiceRepository,
    private commissionRepository: CommissionRepository,
    private expenseService: ExpenseService,
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

    const expenses = await this.expenseService.getExpensesForPeriod(
      formatDateToString(start),
      formatDateToString(end),
    );

    // Lucro: serviços pagos − comissões pagas − despesas do período.
    const netProfit = totalPaid - totalCommissionsPaid - expenses.total;

    return {
      totalScheduled,
      totalPaid,
      totalUnpaid,
      totalCommissionsPaid,
      totalCommissionsExpected,
      totalExpenses: expenses.total,
      expensesByCategory: expenses.byCategory,
      netAmount,
      netAmountExpected,
      netProfit,
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

  /**
   * Série temporal mensal dos últimos `months` meses (terminando no mês atual),
   * com agendamentos, serviços, receita e ticket médio por mês.
   * Agendamentos e serviços cancelados são ignorados.
   */
  async getMonthlyTimeseries(
    months: number,
  ): Promise<MonthlyTimeseriesPoint[]> {
    const tenantId = this.getTenantId();

    const now = DateTime.now().setZone('America/Sao_Paulo');
    const startMonth = now.startOf('month').minus({ months: months - 1 });
    const start = startOfDay(startMonth.toFormat('yyyy-MM-dd'));
    const end = endOfDay(now.endOf('month').toFormat('yyyy-MM-dd'));

    // Serviços (não cancelados) com seus agendamentos (não cancelados) no período.
    const rows = await this.scheduledServiceRepository
      .createQueryBuilder('scheduledService')
      .select("to_char(appointment.date, 'YYYY-MM')", 'month')
      .addSelect('COUNT(DISTINCT appointment.id)', 'appointmentsCount')
      .addSelect('COUNT(scheduledService.id)', 'servicesCount')
      .addSelect('COALESCE(SUM(scheduledService.price), 0)', 'revenue')
      .innerJoin('scheduledService.appointment', 'appointment')
      .where('scheduledService.tenantId = :tenantId', { tenantId })
      .andWhere('appointment.date BETWEEN :start AND :end', { start, end })
      .andWhere('scheduledService.status != :cancelled', {
        cancelled: ScheduledServiceStatus.CANCELLED,
      })
      .andWhere('appointment.status != :apptCancelled', {
        apptCancelled: AppointmentStatus.CANCELLED,
      })
      .groupBy("to_char(appointment.date, 'YYYY-MM')")
      .getRawMany<{
        month: string;
        appointmentsCount: string;
        servicesCount: string;
        revenue: string;
      }>();

    const byMonth = new Map(rows.map((r) => [r.month, r]));

    // Preenche todos os meses da janela (inclusive os sem dados).
    const points: MonthlyTimeseriesPoint[] = [];
    for (let i = 0; i < months; i++) {
      const dt = startMonth.plus({ months: i }).setLocale('pt-BR');
      const key = dt.toFormat('yyyy-MM');
      const row = byMonth.get(key);

      const appointmentsCount = Number(row?.appointmentsCount ?? 0);
      const servicesCount = Number(row?.servicesCount ?? 0);
      const revenue = Number(row?.revenue ?? 0);
      const averageTicket =
        appointmentsCount > 0 ? revenue / appointmentsCount : 0;

      points.push({
        month: key,
        label: dt.toFormat('LLL/yy'),
        appointmentsCount,
        servicesCount,
        revenue,
        averageTicket,
      });
    }

    return points;
  }

  /**
   * Serviços mais vendidos (por quantidade) nos últimos `months` meses.
   * Serviços cancelados são ignorados.
   */
  async getTopServices(
    months: number,
    limit = 5,
  ): Promise<TopServiceItem[]> {
    const tenantId = this.getTenantId();

    const now = DateTime.now().setZone('America/Sao_Paulo');
    const startMonth = now.startOf('month').minus({ months: months - 1 });
    const start = startOfDay(startMonth.toFormat('yyyy-MM-dd'));
    const end = endOfDay(now.endOf('month').toFormat('yyyy-MM-dd'));

    const rows = await this.scheduledServiceRepository
      .createQueryBuilder('scheduledService')
      .select('service.id', 'serviceId')
      .addSelect('service.name', 'serviceName')
      .addSelect('COUNT(scheduledService.id)', 'quantity')
      .addSelect('COALESCE(SUM(scheduledService.price), 0)', 'revenue')
      .innerJoin('scheduledService.appointment', 'appointment')
      .innerJoin('scheduledService.service', 'service')
      .where('scheduledService.tenantId = :tenantId', { tenantId })
      .andWhere('appointment.date BETWEEN :start AND :end', { start, end })
      .andWhere('scheduledService.status != :cancelled', {
        cancelled: ScheduledServiceStatus.CANCELLED,
      })
      .andWhere('appointment.status != :apptCancelled', {
        apptCancelled: AppointmentStatus.CANCELLED,
      })
      .groupBy('service.id')
      .addGroupBy('service.name')
      .orderBy('quantity', 'DESC')
      .limit(limit)
      .getRawMany<{
        serviceId: string;
        serviceName: string;
        quantity: string;
        revenue: string;
      }>();

    return rows.map((r) => ({
      serviceId: r.serviceId,
      serviceName: r.serviceName,
      quantity: Number(r.quantity),
      revenue: Number(r.revenue),
    }));
  }
}
