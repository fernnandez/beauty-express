import { BadRequestException } from '@nestjs/common';
import {
  resolveCommissionPercentage,
  resolveCommissionRateId,
} from './commission-rate.util';

describe('commission-rate.util', () => {
  const rates = [
    { id: 'rate-hair', percentage: 50 },
    { id: 'rate-nails', percentage: 40 },
  ];

  describe('resolveCommissionPercentage', () => {
    it('uses the selected rate', () => {
      expect(resolveCommissionPercentage(rates, 'rate-nails')).toBe(40);
    });

    it('uses the only rate when none is selected', () => {
      expect(resolveCommissionPercentage([rates[0]])).toBe(50);
    });

    it('returns 0 when the collaborator has no rates', () => {
      expect(resolveCommissionPercentage([])).toBe(0);
    });

    it('throws when multiple rates exist and none is selected', () => {
      expect(() => resolveCommissionPercentage(rates)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('resolveCommissionRateId', () => {
    it('returns the selected rate id', () => {
      expect(resolveCommissionRateId(rates, 'rate-hair')).toBe('rate-hair');
    });

    it('auto-selects the only rate', () => {
      expect(resolveCommissionRateId([rates[1]])).toBe('rate-nails');
    });

    it('returns null when multiple rates exist and none is selected', () => {
      expect(resolveCommissionRateId(rates)).toBeNull();
    });
  });
});
