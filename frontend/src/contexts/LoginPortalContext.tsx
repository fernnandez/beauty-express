import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { portalService } from '../services/portal.service';
import type { LoginBranding } from '../types/branding.types';
import { getPortalHost } from '../utils/portal-host.util';
import { DEFAULT_LOGIN_BRANDING } from '../utils/theme.util';

interface LoginPortalContextValue {
  branding: LoginBranding;
  isLoading: boolean;
  error: string | null;
  portalHost: string;
}

const LoginPortalContext = createContext<LoginPortalContextValue | null>(null);

export function LoginPortalProvider({ children }: { children: ReactNode }) {
  const portalHost = getPortalHost();
  const [branding, setBranding] = useState<LoginBranding>(DEFAULT_LOGIN_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPortal = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const portal = await portalService.resolve(portalHost);
        if (!cancelled) {
          setBranding({
            ...portal.loginBranding,
            logoUrl: portal.loginBranding.logoUrl || '/logo.png',
          });
        }
      } catch {
        if (!cancelled) {
          setError('Portal não encontrado para este endereço.');
          setBranding(DEFAULT_LOGIN_BRANDING);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPortal();

    return () => {
      cancelled = true;
    };
  }, [portalHost]);

  const value = useMemo(
    () => ({
      branding,
      isLoading,
      error,
      portalHost,
    }),
    [branding, isLoading, error, portalHost],
  );

  return (
    <LoginPortalContext.Provider value={value}>
      {children}
    </LoginPortalContext.Provider>
  );
}

export function useLoginPortal(): LoginPortalContextValue {
  const context = useContext(LoginPortalContext);
  if (!context) {
    throw new Error('useLoginPortal deve ser usado dentro de LoginPortalProvider');
  }
  return context;
}
