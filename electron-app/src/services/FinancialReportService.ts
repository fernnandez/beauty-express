import { Repository } from 'typeorm';
import { getDataSource } from '../database/database';
import { ScheduledService, ScheduledServiceStatus } from '../entities/ScheduledService';
import { Commission } from '../entities/Commission';
import { startOfDay, endOfDay, formatDateToString } from '../utils/date.util';

export interface FinancialReport {
  totalScheduled: number; // Total de serviços agendados
  totalPaid: number; // Total de serviços pagos (completados)
  totalUnpaid: number; // Total de serviços não pagos (pendentes)
  totalCommissionsPaid: number; // Total de comissões pagas
  netAmount: number; // Valor líquido (total pago - comissões pagas)
  period: {
    startDate: string;
    endDate: string;
  };
}

export class FinancialReportService {
  private scheduledServiceRepository: Repository<ScheduledService>;
  private commissionRepository: Repository<Commission>;

  constructor() {
    this.scheduledServiceRepository = getDataSource().getRepository(ScheduledService);
    this.commissionRepository = getDataSource().getRepository(Commission);
  }

  async getMonthlyReport(
    year: number,
    month: number,
  ): Promise<FinancialReport> {
    // Cria as datas de início e fim do mês
    const startDate = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const start = startOfDay(startDate);
    const end = endOfDay(lastDay);

    // Busca todos os scheduled services do período através dos appointments
    const scheduledServices = await this.scheduledServiceRepository
      .createQueryBuilder('scheduledService')
      .leftJoinAndSelect('scheduledService.appointment', 'appointment')
      .where('appointment.date BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      })
      .getMany();

    // Calcula totais
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

    // Busca comissões pagas do período
    const paidCommissions = await this.commissionRepository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.scheduledService', 'scheduledService')
      .leftJoinAndSelect('scheduledService.appointment', 'appointment')
      .where('appointment.date BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      })
      .andWhere('commission.paid = :paid', { paid: true })
      .getMany();

    const totalCommissionsPaid = paidCommissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0,
    );

    // Valor líquido = total pago - comissões pagas
    const netAmount = totalPaid - totalCommissionsPaid;

    return {
      totalScheduled,
      totalPaid,
      totalUnpaid,
      totalCommissionsPaid,
      netAmount,
      period: {
        startDate: formatDateToString(start),
        endDate: formatDateToString(end),
      },
    };
  }
}
