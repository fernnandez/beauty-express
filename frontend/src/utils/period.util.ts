import { DateTime } from "luxon";

const ZONE = "America/Sao_Paulo";

export type Fortnight = "full" | "first" | "second";

export interface Period {
  /** Ano de referência. */
  year: number;
  /** Mês de referência (1-12). */
  month: number;
  /** Quinzena: mês inteiro, primeira (1-15) ou segunda (16-fim). */
  fortnight: Fortnight;
}

/** Período inicial: mês atual, mês inteiro. */
export function currentMonthPeriod(): Period {
  const now = DateTime.now().setZone(ZONE);
  return { year: now.year, month: now.month, fortnight: "full" };
}

export type PeriodMode = "biweekly" | "monthly";

/**
 * Período inicial conforme o regime do estabelecimento:
 * - monthly: mês atual inteiro.
 * - biweekly: quinzena vigente (1ª se hoje <= 15, senão 2ª).
 */
export function initialPeriodForMode(mode: PeriodMode): Period {
  const now = DateTime.now().setZone(ZONE);
  if (mode === "monthly") {
    return { year: now.year, month: now.month, fortnight: "full" };
  }
  return {
    year: now.year,
    month: now.month,
    fortnight: now.day <= 15 ? "first" : "second",
  };
}

/** Converte o período em datas yyyy-MM-dd (início/fim) para a API. */
export function periodToDateRange(period: Period): {
  startDate: string;
  endDate: string;
} {
  const base = DateTime.fromObject(
    { year: period.year, month: period.month, day: 1 },
    { zone: ZONE },
  );
  const lastDay = base.endOf("month").day;

  let startDay: number;
  let endDay: number;

  switch (period.fortnight) {
    case "first":
      startDay = 1;
      endDay = Math.min(15, lastDay);
      break;
    case "second":
      startDay = Math.min(16, lastDay);
      endDay = lastDay;
      break;
    default:
      startDay = 1;
      endDay = lastDay;
  }

  return {
    startDate: base.set({ day: startDay }).toFormat("yyyy-MM-dd"),
    endDate: base.set({ day: endDay }).toFormat("yyyy-MM-dd"),
  };
}

/** Rótulo do mês, ex.: "Outubro 2026". */
export function monthLabel(period: Period): string {
  const dt = DateTime.fromObject(
    { year: period.year, month: period.month, day: 1 },
    { zone: ZONE },
  ).setLocale("pt-BR");
  const label = dt.toFormat("LLLL yyyy");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Avança/retrocede o mês mantendo a quinzena. */
export function shiftMonth(period: Period, delta: number): Period {
  const dt = DateTime.fromObject(
    { year: period.year, month: period.month, day: 1 },
    { zone: ZONE },
  ).plus({ months: delta });
  return { year: dt.year, month: dt.month, fortnight: period.fortnight };
}

/** Rótulo "mês/ano" simples para um ano/mês, ex.: "Outubro 2026". */
export function monthLabelFrom(year: number, month: number): string {
  return monthLabel({ year, month, fortnight: "full" });
}

interface ExpenseLike {
  type: "one_time" | "recurring";
  date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

/**
 * Diz se uma despesa incide em um mês específico.
 * - Esporádica: a data cai dentro do mês.
 * - Recorrente: está ativa e vigente em algum momento do mês.
 */
export function expenseIncidesInMonth(
  expense: ExpenseLike,
  year: number,
  month: number,
): boolean {
  const monthStart = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: ZONE },
  ).startOf("month");
  const monthEnd = monthStart.endOf("month");

  if (expense.type === "one_time") {
    if (!expense.date) return false;
    const d = DateTime.fromISO(expense.date, { zone: ZONE });
    return d >= monthStart && d <= monthEnd;
  }

  // recorrente
  if (!expense.isActive) return false;
  const vigStart = expense.startDate
    ? DateTime.fromISO(expense.startDate, { zone: ZONE }).startOf("day")
    : null;
  const vigEnd = expense.endDate
    ? DateTime.fromISO(expense.endDate, { zone: ZONE }).endOf("day")
    : null;

  const startsBeforeMonthEnds = !vigStart || vigStart <= monthEnd;
  const endsAfterMonthStarts = !vigEnd || vigEnd >= monthStart;
  return startsBeforeMonthEnds && endsAfterMonthStarts;
}
