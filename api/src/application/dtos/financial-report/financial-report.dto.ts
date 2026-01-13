import { ApiProperty } from '@nestjs/swagger';

export class FinancialReportDto {
  @ApiProperty({ description: 'Total de serviços agendados no período' })
  totalScheduled: number;

  @ApiProperty({ description: 'Total de serviços pagos (completados)' })
  totalPaid: number;

  @ApiProperty({ description: 'Total de serviços não pagos (pendentes)' })
  totalUnpaid: number;

  @ApiProperty({ description: 'Total de comissões pagas no período' })
  totalCommissionsPaid: number;

  @ApiProperty({ description: 'Total de comissões previstas (pagas + não pagas)' })
  totalCommissionsExpected: number;

  @ApiProperty({ description: 'Valor líquido (total pago - comissões pagas)' })
  netAmount: number;

  @ApiProperty({ description: 'Valor líquido previsto (total pago - todas as comissões previstas)' })
  netAmountExpected: number;

  @ApiProperty({ description: 'Período do relatório' })
  period: {
    startDate: string;
    endDate: string;
  };
}

