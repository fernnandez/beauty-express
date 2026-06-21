import { MantineProvider } from '@mantine/core';
import { useMemo, useRef, type ReactNode } from 'react';
import { useLoginPortal } from '../contexts/LoginPortalContext';
import { createBrandingTheme } from '../utils/theme.util';

const LOGIN_THEME_ROOT_ID = 'login-theme-root';

export function LoginThemeProvider({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { branding } = useLoginPortal();

  const theme = useMemo(
    () => createBrandingTheme(branding.primaryColor),
    [branding.primaryColor],
  );

  return (
    <div
      ref={rootRef}
      id={LOGIN_THEME_ROOT_ID}
      data-mantine-color-scheme="light"
      style={{ minHeight: '100vh' }}
    >
      <MantineProvider
        theme={theme}
        key={branding.primaryColor}
        cssVariablesSelector={`#${LOGIN_THEME_ROOT_ID}`}
        getRootElement={() => rootRef.current ?? document.body}
      >
        {children}
      </MantineProvider>
    </div>
  );
}
