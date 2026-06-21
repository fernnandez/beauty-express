import {
  formatBrazilianPhone,
  isValidBrazilianPhone,
  isValidInternationalPhone,
  isValidPhone,
  normalizePhone,
  preparePhoneForStorage,
} from './phone.util';

describe('phone.util', () => {
  describe('normalizePhone', () => {
    it('should remove non-digit characters', () => {
      expect(normalizePhone('(11) 99999-9999')).toBe('11999999999');
      expect(normalizePhone('+351 912 345 678')).toBe('351912345678');
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

  describe('isValidInternationalPhone', () => {
    it('should accept foreign numbers with country code', () => {
      expect(isValidInternationalPhone('+351912345678')).toBe(true);
      expect(isValidInternationalPhone('+14155552671')).toBe(true);
      expect(isValidInternationalPhone('+442079460958')).toBe(true);
    });

    it('should reject too short or too long numbers', () => {
      expect(isValidInternationalPhone('+1234567')).toBe(false);
      expect(isValidInternationalPhone('+1'.padEnd(17, '0'))).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should accept brazilian and international numbers', () => {
      expect(isValidPhone('11999999999')).toBe(true);
      expect(isValidPhone('+351912345678')).toBe(true);
      expect(isValidPhone('+5511999999999')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(isValidPhone('123')).toBe(false);
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
    it('should normalize and format brazilian phone', () => {
      expect(preparePhoneForStorage('11999999999')).toEqual({
        phone: '(11) 99999-9999',
        phoneNormalized: '11999999999',
      });
    });

    it('should normalize and format international phone', () => {
      expect(preparePhoneForStorage('+351 912 345 678')).toEqual({
        phone: '+351912345678',
        phoneNormalized: '351912345678',
      });
    });

    it('should format brazilian phone with country code', () => {
      expect(preparePhoneForStorage('+5511999999999')).toEqual({
        phone: '+55 (11) 99999-9999',
        phoneNormalized: '5511999999999',
      });
    });
  });
});
