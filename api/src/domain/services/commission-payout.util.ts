import { DateTime } from 'luxon';

const TZ = 'America/Sao_Paulo';

export const DEFAULT_COMMISSION_PAYOUT_DAYS = [15, 30];

export type PeriodMode = 'biweekly' | 'monthly';

export const DEFAULT_PERIOD_MODE: PeriodMode = 'biweekly';

/**
 * Resolve os dias de vencimento de comissão a partir do regime de período do
 * estabelecimento, com override opcional explícito.
 * - biweekly (quinzenal): vence no dia 15 e no último dia do mês (31 é limitado
 *   ao último dia real de cada mês pela util de clamp).
 * - monthly (mensal): vence apenas no último dia do mês.
 * Quando `override` tem valores válidos, ele prevalece sobre o regime.
 */
export function resolvePayoutDays(
  periodMode: PeriodMode | null | undefined,
  override?: number[] | null,
): number[] {
  if (override && override.length > 0) {
    return normalizePayoutDays(override);
  }
  return periodMode === 'monthly' ? [31] : [15, 31];
}

/**
 * Normaliza a lista de dias de pagamento: inteiros entre 1 e 31, únicos e
 * ordenados crescentemente. Cai para o default se vier vazia/inválida.
 */
export function normalizePayoutDays(
  days: number[] | null | undefined,
): number[] {
  const cleaned = Array.from(
    new Set(
      (days ?? [])
        .map((d) => Math.trunc(Number(d)))
        .filter((d) => Number.isFinite(d) && d >= 1 && d <= 31),
    ),
  ).sort((a, b) => a - b);

  return cleaned.length > 0 ? cleaned : [...DEFAULT_COMMISSION_PAYOUT_DAYS];
}

/**
 * Ajusta um "dia de pagamento" para um mês/ano concretos, limitando ao último
 * dia do mês (ex.: dia 30 em fevereiro vira 28/29; dia 31 em abril vira 30).
 */
function clampDayToMonth(year: number, month: number, day: number): DateTime {
  const base = DateTime.fromObject({ year, month, day: 1 }, { zone: TZ });
  const lastDay = base.daysInMonth ?? 31;
  return base.set({ day: Math.min(day, lastDay) });
}

/**
 * Dada a data em que o serviço foi realizado (data do agendamento) e os dias de
 * pagamento do estabelecimento, retorna a data de vencimento da comissão: o
 * primeiro dia de pagamento igual ou posterior à data do serviço. Se já passou
 * de todos os dias de pagamento do mês, vence no primeiro dia de pagamento do
 * mês seguinte.
 */
export function getCommissionDueDate(
  serviceDate: Date,
  payoutDays: number[],
): Date {
  const days = normalizePayoutDays(payoutDays);
  const service = DateTime.fromJSDate(serviceDate, { zone: TZ }).startOf('day');

  // Candidatos no mês do serviço (dias limitados ao tamanho do mês).
  for (const day of days) {
    const candidate = clampDayToMonth(service.year, service.month, day);
    if (candidate >= service) {
      return candidate.toJSDate();
    }
  }

  // Passou de todos os dias do mês → primeiro dia de pagamento do mês seguinte.
  const nextMonth = service.plus({ months: 1 });
  const firstNext = clampDayToMonth(nextMonth.year, nextMonth.month, days[0]);
  return firstNext.toJSDate();
}

/**
 * Uma comissão não paga está ATRASADA quando hoje já passou do dia de
 * vencimento (regra D+1: no próprio dia do vencimento ainda está no prazo).
 */
export function isCommissionOverdue(
  serviceDate: Date,
  payoutDays: number[],
  now: Date = new Date(),
): boolean {
  const due = DateTime.fromJSDate(
    getCommissionDueDate(serviceDate, payoutDays),
    { zone: TZ },
  ).startOf('day');
  const today = DateTime.fromJSDate(now, { zone: TZ }).startOf('day');
  // D+1: atrasa só a partir do dia seguinte ao vencimento.
  return today > due;
}
