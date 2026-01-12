import { VALIDATION_CONSTANTS } from '../constants/validation.constants';

/**
 * Utilitários para validação de datas
 */

/**
 * Valida o formato de data (yyyy-mm-dd)
 */
export function isValidDateFormat(date: string): boolean {
  return VALIDATION_CONSTANTS.DATE_FORMAT.REGEX.test(date);
}

/**
 * Valida formato de data e lança erro se inválido
 * @throws Error se o formato for inválido
 */
export function validateDateFormat(date: string): void {
  if (!isValidDateFormat(date)) {
    throw new Error(
      `${VALIDATION_CONSTANTS.DATE_FORMAT.MESSAGE}, got: ${date}`,
    );
  }
}
