import type { TenantSettings } from './tenant-settings.types';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantName?: string;
  tenantSettings?: TenantSettings;
}

export interface LoginDto {
  email: string;
  password: string;
  portalHost: string;
}

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}
