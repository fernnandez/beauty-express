import {
  TenantBranding,
  LoginBranding,
} from '../types/branding.types';
import {
  TenantFeatureSettings,
  TenantSettings,
  TenantSettingsResponse,
} from '../types/tenant-settings.types';

export const DEFAULT_PRIMARY_COLOR = '#e64980';
export const DEFAULT_ACCENT_COLOR = '#faf5ff';

export function defaultLoginBranding(displayName = 'Beauty Express'): LoginBranding {
  return {
    displayName,
    logoUrl: null,
    faviconUrl: null,
    primaryColor: DEFAULT_PRIMARY_COLOR,
    accentColor: DEFAULT_ACCENT_COLOR,
  };
}

export function defaultTenantSettings(
  displayName = 'Beauty Express',
  overrides?: Partial<TenantSettings> | null,
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

  return {
    branding: {
      displayName:
        defaults.branding.displayName?.trim() || fallbackDisplayName,
      logoUrl: defaults.branding.logoUrl ?? null,
      faviconUrl: defaults.branding.faviconUrl ?? null,
      primaryColor: defaults.branding.primaryColor || DEFAULT_PRIMARY_COLOR,
      accentColor: defaults.branding.accentColor || DEFAULT_ACCENT_COLOR,
    },
    features: {
      commissionsEnabled: defaults.features.commissionsEnabled !== false,
      financialReportsMode:
        defaults.features.financialReportsMode === 'revenue_only'
          ? 'revenue_only'
          : 'full',
    },
  };
}

export function normalizeLoginBranding(
  raw: Partial<LoginBranding> | null | undefined,
  fallbackDisplayName: string,
): LoginBranding {
  const defaults = defaultLoginBranding(fallbackDisplayName);

  return {
    displayName: raw?.displayName?.trim() || defaults.displayName,
    logoUrl: raw?.logoUrl ?? defaults.logoUrl ?? null,
    faviconUrl: raw?.faviconUrl ?? defaults.faviconUrl ?? null,
    primaryColor: raw?.primaryColor || defaults.primaryColor,
    accentColor: raw?.accentColor || defaults.accentColor,
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

export function mergeLoginBrandingForSave(
  current: Partial<LoginBranding> | null | undefined,
  patch: Partial<LoginBranding> | undefined,
  fallbackDisplayName: string,
): LoginBranding {
  return normalizeLoginBranding(
    {
      ...(current ?? {}),
      ...(patch ?? {}),
    },
    fallbackDisplayName,
  );
}

export function normalizePortalHost(host: string): string {
  return host.trim().toLowerCase().split(':')[0];
}
