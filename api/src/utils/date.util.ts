import { DateTime } from 'luxon';

/**
 * Converte uma string no formato yyyy-mm-dd para um objeto Date às 00:00:00 no timezone America/Sao_Paulo
 * @param dateString String no formato yyyy-mm-dd
 * @returns Date object às 00:00:00 no timezone local (será salvo como UTC no banco)
 */
export function parseDateString(dateString: string): Date {
  // Valida o formato
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(
      `Invalid date format. Expected yyyy-mm-dd, got: ${dateString}`,
    );
  }

  // Usa Luxon para criar a data no timezone America/Sao_Paulo às 00:00:00
  const luxonDate = DateTime.fromISO(dateString, {
    zone: 'America/Sao_Paulo',
  }).startOf('day');

  // Converte para Date (será salvo no banco como UTC)
  return luxonDate.toJSDate();
}

/**
 * Converte um objeto Date para string no formato yyyy-mm-dd
 * Garante que a data seja interpretada no timezone America/Sao_Paulo
 * @param date Date object
 * @returns String no formato yyyy-mm-dd
 */
export function formatDateToString(date: Date): string {
  // Converte o Date para Luxon no timezone America/Sao_Paulo
  const luxonDate = DateTime.fromJSDate(date, { zone: 'America/Sao_Paulo' });
  return luxonDate.toFormat('yyyy-MM-dd');
}

/**
 * Cria um Date object para o início do dia (00:00:00) no timezone America/Sao_Paulo
 * @param dateString String no formato yyyy-mm-dd ou Date object
 * @returns Date object representando o início do dia
 */
export function startOfDay(date: string | Date): Date {
  if (typeof date === 'string') {
    return parseDateString(date);
  }
  const luxonDate = DateTime.fromJSDate(date, {
    zone: 'America/Sao_Paulo',
  }).startOf('day');
  return luxonDate.toJSDate();
}

/**
 * Cria um Date object para o final do dia (23:59:59.999) no timezone America/Sao_Paulo
 * @param dateString String no formato yyyy-mm-dd ou Date object
 * @returns Date object representando o final do dia
 */
export function endOfDay(date: string | Date): Date {
  let luxonDate: DateTime;
  if (typeof date === 'string') {
    luxonDate = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' });
  } else {
    luxonDate = DateTime.fromJSDate(date, { zone: 'America/Sao_Paulo' });
  }
  return luxonDate.endOf('day').toJSDate();
}
