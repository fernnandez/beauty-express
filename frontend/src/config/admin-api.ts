import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { adminAuthStorage } from '../services/admin-auth-storage';
import { adminAuthService } from '../services/admin-auth.service';
import type { ApiErrorResponse } from '../types/api.types';
import { resolveApiBaseUrl } from '../utils/api-url.util';

const API_BASE_URL = resolveApiBaseUrl();

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
};

const rejectQueue = () => {
  refreshQueue = [];
};

adminApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = adminAuthStorage.getAccessToken();
  if (token && !config.url?.includes('/auth/admin/login')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/admin/login') ||
      originalRequest?.url?.includes('/auth/admin/refresh');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      const refreshToken = adminAuthStorage.getRefreshToken();
      if (!refreshToken) {
        adminAuthStorage.clear();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(adminApi(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await adminAuthService.refresh(refreshToken);
        const user = adminAuthStorage.getUser();
        if (user) {
          adminAuthStorage.setSession(
            tokens.accessToken,
            tokens.refreshToken,
            user,
          );
        } else {
          localStorage.setItem(
            'beauty_express_admin_access_token',
            tokens.accessToken,
          );
          localStorage.setItem(
            'beauty_express_admin_refresh_token',
            tokens.refreshToken,
          );
        }
        processQueue(tokens.accessToken);
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return adminApi(originalRequest);
      } catch (refreshError) {
        rejectQueue();
        adminAuthStorage.clear();
        if (!window.location.pathname.startsWith('/backoffice/login')) {
          window.location.href = '/backoffice/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
