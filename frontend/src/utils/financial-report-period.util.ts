import { DateTime } from 'luxon';

const SP_ZONE = 'America/Sao_Paulo';

export type FinancialReportPeriodType = 'fortnight' | 'month';

export type FortnightHalf = 'first' | 'second';

export interface FinancialReportPeriodRange {
  startDate: string;
  endDate: string;
  label: string;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function formatMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

export function resolveFinancialReportPeriod(
  type: FinancialReportPeriodType,
  referenceDate: Date,
  fortnightHalf: FortnightHalf = 'first',
): FinancialReportPeriodRange {
  const ref = DateTime.fromJSDate(referenceDate, { zone: SP_ZONE });

  if (!ref.isValid) {
    const now = DateTime.now().setZone(SP_ZONE);
    return resolveFinancialReportPeriod(type, now.toJSDate(), fortnightHalf);
  }

  if (type === 'fortnight') {
    const year = ref.year;
    const month = ref.month;

    if (fortnightHalf === 'first') {
      const start = DateTime.fromObject({ year, month, day: 1 }, { zone: SP_ZONE });
      const end = DateTime.fromObject({ year, month, day: 15 }, { zone: SP_ZONE });

      return {
        startDate: start.toFormat('yyyy-MM-dd'),
        endDate: end.toFormat('yyyy-MM-dd'),
        label: `1ª quinzena de ${formatMonthYear(month, year)}`,
      };
    }

    const start = DateTime.fromObject({ year, month, day: 16 }, { zone: SP_ZONE });
    const end = start.endOf('month');

    return {
      startDate: start.toFormat('yyyy-MM-dd'),
      endDate: end.toFormat('yyyy-MM-dd'),
      label: `2ª quinzena de ${formatMonthYear(month, year)}`,
    };
  }

  const start = ref.startOf('month');
  const end = ref.endOf('month');

  return {
    startDate: start.toFormat('yyyy-MM-dd'),
    endDate: end.toFormat('yyyy-MM-dd'),
    label: formatMonthYear(ref.month, ref.year),
  };
}
