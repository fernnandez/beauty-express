import { api } from '../config/api';
import type { AuthTokensResponse, AuthUser, LoginDto } from '../types/auth.types';

export const authService = {
  login: async (dto: LoginDto): Promise<AuthTokensResponse> => {
    const response = await api.post<AuthTokensResponse>('/auth/login', dto);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<Omit<AuthTokensResponse, 'user'>> => {
    const response = await api.post<Omit<AuthTokensResponse, 'user'>>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  me: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>('/auth/me');
    return response.data;
  },
};
