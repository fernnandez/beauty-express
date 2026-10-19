import { resolveSecret, parseExpiresInSeconds } from './jwt.config';

describe('resolveSecret', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
    delete process.env.TEST_SECRET;
  });

  it('usa o valor da env quando definido', () => {
    process.env.TEST_SECRET = 'valor-real';
    expect(resolveSecret('TEST_SECRET', 'fallback')).toBe('valor-real');
  });

  it('usa o fallback fora de produção quando a env está ausente', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.TEST_SECRET;
    expect(resolveSecret('TEST_SECRET', 'fallback')).toBe('fallback');
  });

  it('lança erro em produção quando a env está ausente (fail-fast)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TEST_SECRET;
    expect(() => resolveSecret('TEST_SECRET', 'fallback')).toThrow(
      /obrigatória em produção/,
    );
  });

  it('aceita a env mesmo em produção', () => {
    process.env.NODE_ENV = 'production';
    process.env.TEST_SECRET = 'prod-secret';
    expect(resolveSecret('TEST_SECRET', 'fallback')).toBe('prod-secret');
  });
});

describe('parseExpiresInSeconds', () => {
  it('converte segundos, minutos, horas e dias', () => {
    expect(parseExpiresInSeconds('30s')).toBe(30);
    expect(parseExpiresInSeconds('15m')).toBe(900);
    expect(parseExpiresInSeconds('2h')).toBe(7200);
    expect(parseExpiresInSeconds('7d')).toBe(604800);
  });

  it('usa 900s como fallback para formato inválido', () => {
    expect(parseExpiresInSeconds('abc')).toBe(900);
  });
});
