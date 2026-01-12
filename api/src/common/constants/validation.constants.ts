/**
 * Constantes de validação reutilizáveis
 */
export const VALIDATION_CONSTANTS = {
  TIME_FORMAT: {
    REGEX: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    MESSAGE: 'Invalid time format. Use HH:MM format',
  },
  DATE_FORMAT: {
    REGEX: /^\d{4}-\d{2}-\d{2}$/,
    MESSAGE: 'Invalid date format. Expected yyyy-mm-dd',
  },
  COMMISSION_PERCENTAGE: {
    MIN: 0,
    MAX: 100,
    MESSAGE: 'Commission percentage must be between 0 and 100',
  },
  PRICE: {
    MIN: 0,
    MESSAGE: 'Price must be greater than zero',
  },
  MONTH: {
    MIN: 1,
    MAX: 12,
    MESSAGE: 'Month must be between 1 and 12',
  },
  YEAR: {
    MIN: 2000,
    MAX: 2100,
    MESSAGE: 'Year must be between 2000 and 2100',
  },
} as const;
