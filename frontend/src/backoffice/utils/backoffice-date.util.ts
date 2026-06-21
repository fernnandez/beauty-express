import { DateTime } from 'luxon';
import { formatDateToString } from '../../utils/appointment.utils';

export function todayDateString(): string {
  return DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd');
}

export function datePickerToApiString(
  value: Date | string | null | undefined,
): string {
  return formatDateToString(value ?? null) ?? todayDateString();
}

export function parseMonthFromPicker(
  value: Date | string | null | undefined,
): { year: number; month: number } {
  const fallback = DateTime.now().setZone('America/Sao_Paulo');

  if (!value) {
    return { year: fallback.year, month: fallback.month };
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    return { year, month };
  }

  const formatted = formatDateToString(value);
  if (formatted) {
    const parsed = DateTime.fromFormat(formatted, 'yyyy-MM-dd', {
      zone: 'America/Sao_Paulo',
    });
    if (parsed.isValid) {
      return { year: parsed.year, month: parsed.month };
    }
  }

  return { year: fallback.year, month: fallback.month };
}
