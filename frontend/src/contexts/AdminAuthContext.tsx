import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { adminAuthStorage } from '../services/admin-auth-storage';
import { adminAuthService } from '../services/admin-auth.service';
import type { AuthUser, LoginDto } from '../types/auth.types';

interface AdminAuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(adminAuthStorage.getUser());
  const [isLoading, setIsLoading] = useState(adminAuthStorage.hasSession());

  const bootstrap = useCallback(async () => {
    if (!adminAuthStorage.hasSession()) {
      setIsLoading(false);
      return;
    }

    try {
      const profile = await adminAuthService.me();
      if (profile.role !== 'super_admin') {
        throw new Error('Acesso negado');
      }
      setUser(profile);
      adminAuthStorage.setUser(profile);
    } catch {
      adminAuthStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (dto: LoginDto) => {
    const response = await adminAuthService.login(dto);
    if (response.user.role !== 'super_admin') {
      throw new Error('Acesso restrito ao super admin');
    }
    adminAuthStorage.setSession(
      response.accessToken,
      response.refreshToken,
      response.user,
    );
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = adminAuthStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await adminAuthService.logout(refreshToken);
      }
    } finally {
      adminAuthStorage.clear();
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

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider');
  }
  return context;
}
