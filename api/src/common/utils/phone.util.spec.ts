import {
  formatBrazilianPhone,
  isValidBrazilianPhone,
  normalizePhone,
  preparePhoneForStorage,
} from './phone.util';

describe('phone.util', () => {
  describe('normalizePhone', () => {
    it('should remove non-digit characters', () => {
      expect(normalizePhone('(11) 99999-9999')).toBe('11999999999');
    });
  });

  describe('isValidBrazilianPhone', () => {
    it('should accept mobile numbers', () => {
      expect(isValidBrazilianPhone('11999999999')).toBe(true);
      expect(isValidBrazilianPhone('(11) 99999-9999')).toBe(true);
    });

    it('should accept landline numbers', () => {
      expect(isValidBrazilianPhone('1133334444')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(isValidBrazilianPhone('123')).toBe(false);
      expect(isValidBrazilianPhone('118888888')).toBe(false);
      expect(isValidBrazilianPhone('00999999999')).toBe(false);
    });
  });

  describe('formatBrazilianPhone', () => {
    it('should format mobile numbers', () => {
      expect(formatBrazilianPhone('11999999999')).toBe('(11) 99999-9999');
    });

    it('should format landline numbers', () => {
      expect(formatBrazilianPhone('1133334444')).toBe('(11) 3333-4444');
    });
  });

  describe('preparePhoneForStorage', () => {
    it('should normalize and format phone', () => {
      expect(preparePhoneForStorage('11999999999')).toEqual({
        phone: '(11) 99999-9999',
        phoneNormalized: '11999999999',
      });
    });
  });
});
