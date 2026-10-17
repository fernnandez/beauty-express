import type { TenantBranding } from './branding.types';

export type FinancialReportsMode = 'full' | 'revenue_only';

export type PeriodMode = 'biweekly' | 'monthly';

export interface TenantFeatureSettings {
  commissionsEnabled: boolean;
  financialReportsMode: FinancialReportsMode;
  /** Regime de período do estabelecimento. Default 'biweekly' (quinzenal). */
  periodMode: PeriodMode;
  /** Override opcional dos dias de vencimento de comissão (1..31). */
  commissionPayoutDays?: number[];
}

export interface TenantSettings {
  branding: TenantBranding;
  features: TenantFeatureSettings;
}
