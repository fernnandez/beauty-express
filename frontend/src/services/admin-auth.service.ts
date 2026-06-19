import { adminApi } from '../config/admin-api';
import type { AuthTokensResponse, AuthUser, AdminLoginDto } from '../types/auth.types';

export const adminAuthService = {
  login: async (dto: AdminLoginDto): Promise<AuthTokensResponse> => {
    const response = await adminApi.post<AuthTokensResponse>(
      '/auth/admin/login',
      dto,
    );
    return response.data;
  },

  refresh: async (
    refreshToken: string,
  ): Promise<Omit<AuthTokensResponse, 'user'>> => {
    const response = await adminApi.post<Omit<AuthTokensResponse, 'user'>>(
      '/auth/admin/refresh',
      { refreshToken },
    );
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await adminApi.post('/auth/admin/logout', { refreshToken });
  },

  me: async (): Promise<AuthUser> => {
    const response = await adminApi.get<AuthUser>('/auth/admin/me');
    return response.data;
  },
};
