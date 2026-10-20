import { calcCommissionAmount } from './commission-calc.util';

describe('calcCommissionAmount', () => {
  it('calcula percentual sobre o preço', () => {
    expect(calcCommissionAmount(100, 30)).toBe(30);
    expect(calcCommissionAmount(50, 50)).toBe(25);
  });

  it('aceita strings decimais (vindas do Postgres)', () => {
    expect(calcCommissionAmount('100.00', '30')).toBe(30);
  });

  it('trata valores ausentes/ inválidos como zero', () => {
    expect(calcCommissionAmount(null, 30)).toBe(0);
    expect(calcCommissionAmount(100, undefined)).toBe(0);
    expect(calcCommissionAmount('abc', 30)).toBe(0);
  });
});
