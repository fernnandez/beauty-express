import {
  calcCommissionAmount,
  parseMoney,
  roundMoney,
} from './commission-calc.util';

describe('calcCommissionAmount', () => {
  it('calcula percentual sobre o preço', () => {
    expect(calcCommissionAmount(100, 30)).toBe(30);
    expect(calcCommissionAmount(50, 50)).toBe(25);
  });

  it('aceita strings decimais (vindas do Postgres)', () => {
    expect(calcCommissionAmount('100.00', '30')).toBe(30);
  });

  it('aceita valores no formato brasileiro com vírgula', () => {
    expect(calcCommissionAmount('45,00', '40')).toBe(18);
    expect(calcCommissionAmount('48,50', '50')).toBe(24.25);
  });

  it('arredonda a comissão para 2 casas decimais', () => {
    // 33,33 * 30% = 9,999 -> 10,00
    expect(calcCommissionAmount(33.33, 30)).toBe(10);
    // 10,01 * 33% = 3,3033 -> 3,30
    expect(calcCommissionAmount(10.01, 33)).toBe(3.3);
    // 49,99 * 15% = 7,4985 -> 7,50
    expect(calcCommissionAmount(49.99, 15)).toBe(7.5);
  });

  it('trata valores ausentes/ inválidos como zero', () => {
    expect(calcCommissionAmount(null, 30)).toBe(0);
    expect(calcCommissionAmount(100, undefined)).toBe(0);
    expect(calcCommissionAmount('abc', 30)).toBe(0);
  });
});

describe('roundMoney', () => {
  it('arredonda para 2 casas (half-up)', () => {
    expect(roundMoney(9.999)).toBe(10);
    expect(roundMoney(3.3033)).toBe(3.3);
    expect(roundMoney(7.495)).toBe(7.5);
    expect(roundMoney(2.005)).toBe(2.01);
  });

  it('retorna 0 para valores não finitos', () => {
    expect(roundMoney(NaN)).toBe(0);
    expect(roundMoney(Infinity)).toBe(0);
  });
});

describe('parseMoney', () => {
  it('converte number, string com ponto e com vírgula', () => {
    expect(parseMoney(45)).toBe(45);
    expect(parseMoney('45.50')).toBe(45.5);
    expect(parseMoney('45,50')).toBe(45.5);
  });

  it('trata vazio/inválido como zero', () => {
    expect(parseMoney(null)).toBe(0);
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('abc')).toBe(0);
  });
});
