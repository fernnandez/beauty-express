import type { LoginBranding } from '../../types/branding.types';
import type { TenantSettings } from '../../types/tenant-settings.types';

export const DEFAULT_BRANDING: LoginBranding = {
  displayName: 'Beauty Express',
  logoUrl: '/logo.png',
  faviconUrl: null,
  primaryColor: '#e64980',
  accentColor: '#faf5ff',
};

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  branding: { ...DEFAULT_BRANDING },
  features: {
    commissionsEnabled: true,
    financialReportsMode: 'full',
  },
};

export function normalizeBranding(
  branding?: Partial<LoginBranding> | null,
  fallbackName = 'Beauty Express',
): LoginBranding {
  return {
    displayName: branding?.displayName?.trim() || fallbackName,
    logoUrl: branding?.logoUrl ?? DEFAULT_BRANDING.logoUrl,
    faviconUrl: branding?.faviconUrl ?? null,
    primaryColor: branding?.primaryColor || DEFAULT_BRANDING.primaryColor,
    accentColor: branding?.accentColor || DEFAULT_BRANDING.accentColor,
  };
}

export function normalizeTenantSettings(
  settings?: Partial<TenantSettings> | null,
  fallbackName = 'Beauty Express',
): TenantSettings {
  return {
    branding: normalizeBranding(settings?.branding, fallbackName),
    features: {
      commissionsEnabled: settings?.features?.commissionsEnabled !== false,
      financialReportsMode:
        settings?.features?.financialReportsMode === 'revenue_only'
          ? 'revenue_only'
          : 'full',
    },
  };
}
