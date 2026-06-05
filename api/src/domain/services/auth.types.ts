import { UserRole } from '@domain/entities/user-role.enum';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  type: 'access';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantName?: string;
}
