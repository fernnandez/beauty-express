import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { TenantBranding, LoginBranding } from '../types/branding.types';
import type { TenantSettings } from '../types/tenant-settings.types';
import { DEFAULT_LOGIN_BRANDING } from '../utils/theme.util';

const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  branding: {
    displayName: 'Ageendoo',
    logoUrl: '/logo.png',
    faviconUrl: null,
    primaryColor: DEFAULT_LOGIN_BRANDING.primaryColor,
    accentColor: DEFAULT_LOGIN_BRANDING.accentColor,
  },
  features: {
    commissionsEnabled: true,
    financialReportsMode: 'full',
    periodMode: 'biweekly',
  },
};

export function useOperationalBranding(): {
  branding: TenantBranding | LoginBranding;
  settings: TenantSettings;
  commissionsEnabled: boolean;
  periodMode: 'biweekly' | 'monthly';
} {
  const { user } = useAuth();

  return useMemo(() => {
    const settings = user?.tenantSettings ?? DEFAULT_TENANT_SETTINGS;

    return {
      branding: {
        ...settings.branding,
        logoUrl: settings.branding.logoUrl || '/logo.png',
      },
      settings,
      commissionsEnabled: settings.features.commissionsEnabled,
      periodMode: settings.features.periodMode === 'monthly' ? 'monthly' : 'biweekly',
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- depende dos campos primitivos de tenantSettings, não do objeto inteiro
  }, [
    user?.id,
    user?.tenantSettings?.branding.displayName,
    user?.tenantSettings?.branding.primaryColor,
    user?.tenantSettings?.branding.accentColor,
    user?.tenantSettings?.branding.logoUrl,
    user?.tenantSettings?.features.commissionsEnabled,
    user?.tenantSettings?.features.financialReportsMode,
    user?.tenantSettings?.features.periodMode,
  ]);
}
