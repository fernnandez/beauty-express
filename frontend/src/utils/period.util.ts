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
