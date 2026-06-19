import { TenantBranding } from './branding.types';

export type FinancialReportsMode = 'full' | 'revenue_only';

export interface TenantFeatureSettings {
  commissionsEnabled: boolean;
  financialReportsMode: FinancialReportsMode;
}

export interface TenantSettings {
  branding: TenantBranding;
  features: TenantFeatureSettings;
}

export interface TenantSettingsResponse {
  branding: TenantBranding;
  features: TenantFeatureSettings;
}
