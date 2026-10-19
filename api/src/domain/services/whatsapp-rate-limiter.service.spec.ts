import { HttpException } from '@nestjs/common';
import { WhatsappRateLimiter } from './whatsapp-rate-limiter.service';

describe('WhatsappRateLimiter', () => {
  const ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV };
    jest.useRealTimers();
  });

  function makeLimiter(limit: number, windowMs: number): WhatsappRateLimiter {
    process.env.WHATSAPP_SEND_LIMIT = String(limit);
    process.env.WHATSAPP_SEND_WINDOW_MS = String(windowMs);
    return new WhatsappRateLimiter();
  }

  it('permite envios dentro do limite', () => {
    const limiter = makeLimiter(3, 60_000);
    expect(() => limiter.check('t1')).not.toThrow();
    expect(() => limiter.check('t1')).not.toThrow();
    expect(() => limiter.check('t1')).not.toThrow();
  });

  it('lança 429 ao exceder o limite na janela', () => {
    const limiter = makeLimiter(2, 60_000);
    limiter.check('t1');
    limiter.check('t1');
    try {
      limiter.check('t1');
      fail('deveria ter lançado');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(429);
    }
  });

  it('isola o limite por tenant', () => {
    const limiter = makeLimiter(1, 60_000);
    limiter.check('t1');
    expect(() => limiter.check('t2')).not.toThrow(); // outro tenant, balde próprio
    expect(() => limiter.check('t1')).toThrow(HttpException);
  });

  it('libera novos envios após a janela expirar', () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    const limiter = makeLimiter(1, 1_000);
    limiter.check('t1');
    expect(() => limiter.check('t1')).toThrow(HttpException);

    jest.setSystemTime(1_500); // passou da janela de 1s
    expect(() => limiter.check('t1')).not.toThrow();
  });

  it('usa defaults quando as envs são inválidas', () => {
    process.env.WHATSAPP_SEND_LIMIT = 'abc';
    delete process.env.WHATSAPP_SEND_WINDOW_MS;
    const limiter = new WhatsappRateLimiter();
    // default = 20; 20 envios devem passar
    for (let i = 0; i < 20; i++) {
      expect(() => limiter.check('t1')).not.toThrow();
    }
    expect(() => limiter.check('t1')).toThrow(HttpException);
  });
});
