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

export type CommissionAlertStatus = 'overdue' | 'pending' | 'ok';

export interface CollaboratorCommissionAlert {
  collaboratorId: string;
  /** 'overdue' se há não pagas vencidas; 'pending' se só há no prazo; senão 'ok'. */
  status: CommissionAlertStatus;
  /** Soma das comissões não pagas e já vencidas (D+1). */
  overdueAmount: number;
  /** Quantidade de comissões não pagas e já vencidas. */
  overdueCount: number;
  /** Soma das comissões não pagas ainda dentro do prazo. */
  pendingAmount: number;
  /** Quantidade de comissões não pagas ainda dentro do prazo. */
  pendingCount: number;
}
