import { Commission } from '../entities/commission.entity';

export interface CommissionFilterParams {
  paid?: boolean;
  startDate?: Date;
  endDate?: Date;
  collaboratorIds?: string[];
  search?: string;
}

export interface CommissionListSummary {
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}

export interface CommissionListResult {
  items: Commission[];
  total: number;
  page: number;
  limit: number;
  summary: CommissionListSummary;
}

export interface CommissionCollaboratorSummary {
  /** Quantidade de serviços concluídos com comissão (nº de comissões no filtro). */
  servicesCount: number;
  /** Soma de todas as comissões no filtro. */
  totalAmount: number;
  /** Soma das comissões ainda não pagas. */
  pendingAmount: number;
  /** Soma das comissões já pagas. */
  paidAmount: number;
  /** Clientes distintos atendidos (por clientId quando houver, senão por nome). */
  uniqueClients: number;
}
