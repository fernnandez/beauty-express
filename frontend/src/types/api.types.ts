/**
 * Tipos relacionados à API
 */

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface ApiError extends Error {
  response?: {
    data: ApiErrorResponse;
    status: number;
    statusText: string;
  };
}
