import {
  getCommissionDueDate,
  isCommissionOverdue,
  normalizePayoutDays,
  resolvePayoutDays,
} from './commission-payout.util';
import { DateTime } from 'luxon';

const TZ = 'America/Sao_Paulo';

/** Helper: cria um Date no fuso local a partir de yyyy-MM-dd. */
const d = (iso: string) =>
  DateTime.fromISO(iso, { zone: TZ }).startOf('day').toJSDate();

/** Helper: formata um Date para yyyy-MM-dd no fuso local. */
const fmt = (date: Date) =>
  DateTime.fromJSDate(date, { zone: TZ }).toFormat('yyyy-MM-dd');

describe('commission-payout.util', () => {
  describe('normalizePayoutDays', () => {
    it('ordena, remove duplicados e descarta inválidos', () => {
      expect(normalizePayoutDays([30, 15, 15, 0, 32, 10])).toEqual([
        10, 15, 30,
      ]);
    });

    it('cai para o default quando vazio/ inválido', () => {
      expect(normalizePayoutDays([])).toEqual([15, 30]);
      expect(normalizePayoutDays([0, 99])).toEqual([15, 30]);
      expect(normalizePayoutDays(null)).toEqual([15, 30]);
    });
  });

  describe('resolvePayoutDays', () => {
    it('biweekly => [15, 31]', () => {
      expect(resolvePayoutDays('biweekly')).toEqual([15, 31]);
    });

    it('monthly => [31]', () => {
      expect(resolvePayoutDays('monthly')).toEqual([31]);
    });

    it('default (sem modo) => biweekly', () => {
      expect(resolvePayoutDays(null)).toEqual([15, 31]);
    });

    it('override prevalece sobre o modo', () => {
      expect(resolvePayoutDays('monthly', [5, 20])).toEqual([5, 20]);
    });
  });

  describe('getCommissionDueDate (dias [15, 31])', () => {
    const days = [15, 31];

    it('serviço no dia 05 vence no dia 15 do mesmo mês', () => {
      expect(fmt(getCommissionDueDate(d('2026-10-05'), days))).toBe(
        '2026-10-15',
      );
    });

    it('serviço no dia 15 vence no próprio dia 15', () => {
      expect(fmt(getCommissionDueDate(d('2026-10-15'), days))).toBe(
        '2026-10-15',
      );
    });

    it('serviço no dia 16 vence no último dia do mês (31 -> 31/10)', () => {
      expect(fmt(getCommissionDueDate(d('2026-10-16'), days))).toBe(
        '2026-10-31',
      );
    });

    it('dia 31 é limitado ao último dia de meses curtos (fev)', () => {
      // serviço em 20/02/2026 (fev tem 28 dias) -> vence 28/02
      expect(fmt(getCommissionDueDate(d('2026-02-20'), days))).toBe(
        '2026-02-28',
      );
    });

    it('serviço no último dia do mês vence nesse dia', () => {
      expect(fmt(getCommissionDueDate(d('2026-11-30'), days))).toBe(
        '2026-11-30',
      );
    });
  });

  describe('getCommissionDueDate (mensal [31])', () => {
    it('qualquer serviço vence no último dia do mês', () => {
      expect(fmt(getCommissionDueDate(d('2026-10-03'), [31]))).toBe(
        '2026-10-31',
      );
      expect(fmt(getCommissionDueDate(d('2026-02-01'), [31]))).toBe(
        '2026-02-28',
      );
    });
  });

  describe('isCommissionOverdue (D+1)', () => {
    const days = [15, 31];

    it('não está atrasada no próprio dia do vencimento', () => {
      // serviço 05/10 vence 15/10; hoje 15/10 => não atrasada
      expect(isCommissionOverdue(d('2026-10-05'), days, d('2026-10-15'))).toBe(
        false,
      );
    });

    it('fica atrasada a partir do dia seguinte ao vencimento', () => {
      // serviço 05/10 vence 15/10; hoje 16/10 => atrasada
      expect(isCommissionOverdue(d('2026-10-05'), days, d('2026-10-16'))).toBe(
        true,
      );
    });

    it('pendente dentro do ciclo não está atrasada', () => {
      // serviço 16/10 vence 31/10; hoje 20/10 => não atrasada
      expect(isCommissionOverdue(d('2026-10-16'), days, d('2026-10-20'))).toBe(
        false,
      );
    });

    it('acumulado de mês anterior conta como atrasado', () => {
      // serviço 05/09 vence 15/09; hoje 17/10 => atrasada
      expect(isCommissionOverdue(d('2026-09-05'), days, d('2026-10-17'))).toBe(
        true,
      );
    });
  });
});
