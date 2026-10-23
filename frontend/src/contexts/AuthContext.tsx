/* eslint-disable react-refresh/only-export-components --
   Provider e hook convivem no mesmo arquivo (padrão idiomático de Context).
   A regra afeta apenas o hot-reload em dev, não o build de produção. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authStorage } from '../services/auth-storage';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginDto } from '../types/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(authStorage.getUser());
  const [isLoading, setIsLoading] = useState(authStorage.hasSession());

  useEffect(() => {
    // Valida a sessão no servidor apenas quando há tokens. Sem sessão, o
    // estado inicial já reflete isLoading=false (useState(hasSession())).
    if (!authStorage.hasSession()) {
      return;
    }
    let active = true;
    authService
      .me()
      .then((profile) => {
        if (!active) return;
        setUser(profile);
        authStorage.setUser(profile);
      })
      .catch(() => {
        if (!active) return;
        authStorage.clear();
        setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const response = await authService.login(dto);
    authStorage.setSession(
      response.accessToken,
      response.refreshToken,
      response.user,
    );
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = authStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      authStorage.clear();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authStorage.hasSession()) {
      return;
    }
    const profile = await authService.me();
    setUser(profile);
    authStorage.setUser(profile);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
