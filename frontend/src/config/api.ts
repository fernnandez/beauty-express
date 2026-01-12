import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de resposta para tratamento centralizado de erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // Erros já serão tratados pelos componentes através do React Query
    // Este interceptor apenas garante que o erro tenha o formato correto
    return Promise.reject(error);
  },
);
