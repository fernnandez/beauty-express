import type { TenantBranding } from './branding.types';

export type FinancialReportsMode = 'full' | 'revenue_only';

export type PeriodMode = 'biweekly' | 'monthly';

export type ChatDensity = 'compact' | 'comfortable';

export interface QuickReply {
  id?: string;
  title: string;
  message: string;
}

export interface PriceListSettings {
  enabled: boolean;
  message: string;
}

export interface TenantFeatureSettings {
  commissionsEnabled: boolean;
  financialReportsMode: FinancialReportsMode;
  /** Regime de período do estabelecimento. Default 'biweekly' (quinzenal). */
  periodMode: PeriodMode;
  /** Override opcional dos dias de vencimento de comissão (1..31). */
  commissionPayoutDays?: number[];
  /** Respostas rápidas do atendimento. */
  quickReplies?: QuickReply[];
  /** Mensagem de catálogo de preços configurável. */
  priceList?: PriceListSettings;
  /** Densidade visual do inbox de WhatsApp. Default 'comfortable'. */
  chatDensity?: ChatDensity;
}

export interface TenantSettings {
  branding: TenantBranding;
  features: TenantFeatureSettings;
}
