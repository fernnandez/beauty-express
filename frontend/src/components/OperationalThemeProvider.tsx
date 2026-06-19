import { MantineProvider } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOperationalBranding } from '../hooks/useOperationalBranding';
import { createBrandingTheme } from '../utils/theme.util';

interface OperationalThemeProviderProps {
  children: ReactNode;
}

export function OperationalThemeProvider({
  children,
}: OperationalThemeProviderProps) {
  const { isAuthenticated } = useAuth();
  const { branding } = useOperationalBranding();

  const theme = useMemo(
    () => createBrandingTheme(isAuthenticated ? branding.primaryColor : undefined),
    [branding.primaryColor, isAuthenticated],
  );

  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}
