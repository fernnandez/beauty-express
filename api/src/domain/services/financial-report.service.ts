import { Injectable } from '@nestjs/common';
import {
  endOfDay,
  formatDateToString,
  startOfDay,
} from '../../utils/date.util';
import { ScheduledServiceStatus } from '../entities/scheduled-service.entity';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';

export interface FinancialReport {
  totalScheduled: number; // Total de serviços agendados
  totalPaid: number; // Total de serviços pagos (completados)
  totalUnpaid: number; // Total de serviços não pagos (pendentes)
  totalCommissionsPaid: number; // Total de comissões pagas
  totalCommissionsExpected: number; // Total de comissões previstas (pagas + não pagas)
  netAmount: number; // Valor líquido (total pago - comissões pagas)
  netAmountExpected: number; // Valor líquido previsto (total pago - todas as comissões previstas)
  period: {
    startDate: string;
    endDate: string;
  };
}

@Injectable()
export class FinancialReportService {
  constructor(
    private scheduledServiceRepository: ScheduledServiceRepository,
    private commissionRepository: CommissionRepository,
  ) {}

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
    const paidCommissions = await this.commissionRepository.findByFilters({
      paid: true,
      startDate: start,
      endDate: end,
    });

    const totalCommissionsPaid = paidCommissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0,
    );

    // Busca todas as comissões do período (pagas + não pagas)
    const allCommissions = await this.commissionRepository.findByFilters({
      startDate: start,
      endDate: end,
    });

    const totalCommissionsExpected = allCommissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0,
    );

    // Valor líquido = total pago - comissões pagas
    const netAmount = totalPaid - totalCommissionsPaid;

    // Valor líquido previsto = total pago - todas as comissões previstas
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
}
