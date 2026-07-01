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
