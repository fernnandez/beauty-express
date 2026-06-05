export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug?: string;
  tenantName?: string;
}

export interface LoginDto {
  tenantSlug: string;
  email: string;
  password: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}
