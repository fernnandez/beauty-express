import {
  TenantBranding,
} from '../types/branding.types';
import {
  TenantFeatureSettings,
  TenantSettings,
  TenantSettingsResponse,
} from '../types/tenant-settings.types';
import {
  DEFAULT_PERIOD_MODE,
  normalizePayoutDays,
} from './commission-payout.util';

export const DEFAULT_PRIMARY_COLOR = '#e64980';
export const DEFAULT_ACCENT_COLOR = '#faf5ff';

export function defaultTenantSettings(
  displayName = 'Beauty Express',
  overrides?: {
    branding?: Partial<TenantBranding>;
    features?: Partial<TenantFeatureSettings>;
  } | null,
): TenantSettings {
  const base: TenantSettings = {
    branding: {
      displayName,
      logoUrl: null,
      faviconUrl: null,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      accentColor: DEFAULT_ACCENT_COLOR,
    },
    features: {
      commissionsEnabled: true,
      financialReportsMode: 'full',
      periodMode: DEFAULT_PERIOD_MODE,
    },
  };

  if (!overrides) {
    return base;
  }

  return {
    branding: { ...base.branding, ...overrides.branding },
    features: { ...base.features, ...overrides.features },
  };
}

export function normalizeTenantSettings(
  raw: Partial<TenantSettings> | null | undefined,
  fallbackDisplayName: string,
): TenantSettingsResponse {
  const defaults = defaultTenantSettings(fallbackDisplayName, raw ?? undefined);

  const payoutOverride = defaults.features.commissionPayoutDays;

  const features: TenantFeatureSettings = {
    commissionsEnabled: defaults.features.commissionsEnabled !== false,
    financialReportsMode:
      defaults.features.financialReportsMode === 'revenue_only'
        ? 'revenue_only'
        : 'full',
    periodMode:
      defaults.features.periodMode === 'monthly' ? 'monthly' : 'biweekly',
  };

  // Só persiste os dias de pagamento quando houver override explícito válido.
  if (payoutOverride && payoutOverride.length > 0) {
    features.commissionPayoutDays = normalizePayoutDays(payoutOverride);
  }

  return {
    branding: {
      displayName:
        defaults.branding.displayName?.trim() || fallbackDisplayName,
      logoUrl: defaults.branding.logoUrl ?? null,
      faviconUrl: defaults.branding.faviconUrl ?? null,
      primaryColor: defaults.branding.primaryColor || DEFAULT_PRIMARY_COLOR,
      accentColor: defaults.branding.accentColor || DEFAULT_ACCENT_COLOR,
    },
    features,
  };
}

export function buildTenantBrandingFromName(name: string): TenantBranding {
  return defaultTenantSettings(name).branding;
}

export function mergeTenantSettingsForSave(
  current: Partial<TenantSettings> | null | undefined,
  patch:
    | {
        branding?: Partial<TenantBranding>;
        features?: Partial<TenantFeatureSettings>;
      }
    | undefined,
  fallbackDisplayName: string,
): TenantSettings {
  return normalizeTenantSettings(
    {
      branding: {
        ...(current?.branding ?? {}),
        ...(patch?.branding ?? {}),
      },
      features: {
        ...(current?.features ?? {}),
        ...(patch?.features ?? {}),
      },
    } as Partial<TenantSettings>,
    fallbackDisplayName,
  );
}
