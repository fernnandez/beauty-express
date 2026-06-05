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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(authStorage.getUser());
  const [isLoading, setIsLoading] = useState(authStorage.hasSession());

  const bootstrap = useCallback(async () => {
    if (!authStorage.hasSession()) {
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authService.me();
      setUser(profile);
      authStorage.setUser(profile);
    } catch {
      authStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

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

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
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
