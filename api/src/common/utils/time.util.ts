import { VALIDATION_CONSTANTS } from '../constants/validation.constants';

/**
 * Utilitários para manipulação de horários
 */

/**
 * Valida o formato de hora (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  return VALIDATION_CONSTANTS.TIME_FORMAT.REGEX.test(time);
}

/**
 * Converte uma string de hora (HH:MM) para minutos desde meia-noite
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Valida se o horário de início é anterior ao horário de término
 */
export function isStartTimeBeforeEndTime(
  startTime: string,
  endTime: string,
): boolean {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
}

/**
 * Valida formato e ordem de horários
 * @throws Error se o formato ou ordem for inválida
 */
export function validateTimeRange(startTime: string, endTime: string): void {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    throw new Error(VALIDATION_CONSTANTS.TIME_FORMAT.MESSAGE);
  }

  if (!isStartTimeBeforeEndTime(startTime, endTime)) {
    throw new Error('Start time must be before end time');
  }
}
