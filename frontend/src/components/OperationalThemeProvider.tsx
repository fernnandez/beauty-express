import { MantineProvider } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import { useDocumentBranding } from '../hooks/useDocumentBranding';
import { useOperationalBranding } from '../hooks/useOperationalBranding';
import { createBrandingTheme } from '../utils/theme.util';

interface OperationalThemeProviderProps {
  children: ReactNode;
}

export function OperationalThemeProvider({
  children,
}: OperationalThemeProviderProps) {
  const { branding } = useOperationalBranding();
  useDocumentBranding(branding);

  const theme = useMemo(
    () => createBrandingTheme(branding.primaryColor),
    [branding.primaryColor],
  );

  return (
    <MantineProvider
      theme={theme}
      key={branding.primaryColor}
      cssVariablesSelector=":root"
      getRootElement={() => document.documentElement}
    >
      <div data-mantine-color-scheme="light" style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </MantineProvider>
  );
}
