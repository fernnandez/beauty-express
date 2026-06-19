import { MantineProvider } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import { useLoginPortal } from '../contexts/LoginPortalContext';
import { createBrandingTheme } from '../utils/theme.util';

export function LoginThemeProvider({ children }: { children: ReactNode }) {
  const { branding } = useLoginPortal();

  const theme = useMemo(
    () => createBrandingTheme(branding.primaryColor),
    [branding.primaryColor],
  );

  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}
