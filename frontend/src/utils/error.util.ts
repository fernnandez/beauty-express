import type { ApiError, ApiErrorResponse } from '../types/api.types';

/**
 * Extrai a mensagem de erro de uma resposta da API
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'Ocorreu um erro inesperado';
  }

  const apiError = error as ApiError;

  // Erro da API com resposta estruturada
  if (apiError.response?.data) {
    const errorData = apiError.response.data as ApiErrorResponse;
    
    // Se a mensagem for um array, pega a primeira
    if (Array.isArray(errorData.message)) {
      return errorData.message[0] || 'Erro na validação';
    }
    
    // Se for string, retorna diretamente
    if (typeof errorData.message === 'string') {
      return errorData.message;
    }
  }

  // Erro padrão do axios
  if (apiError.response?.statusText) {
    return apiError.response.statusText;
  }

  // Erro genérico
  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocorreu um erro inesperado';
}

/**
 * Verifica se o erro é de rede/conexão
 */
export function isNetworkError(error: unknown): boolean {
  const apiError = error as ApiError;
  return (
    !apiError.response ||
    apiError.message === 'Network Error' ||
    apiError.code === 'ECONNABORTED'
  );
}
