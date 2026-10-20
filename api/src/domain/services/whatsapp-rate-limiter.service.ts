import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

/**
 * Limitador de taxa de ENVIO de WhatsApp, por tenant.
 *
 * Protege o número contra rajadas que podem levar a bloqueio pelo WhatsApp
 * (o modo não-oficial/Baileys é sensível a volume). Usa janela deslizante
 * em memória — adequado para uma única instância de API. Se a API escalar
 * horizontalmente, trocar por um backend compartilhado (ex.: Redis).
 *
 * Configuração por env:
 * - WHATSAPP_SEND_LIMIT     (nº de envios por janela; default 20)
 * - WHATSAPP_SEND_WINDOW_MS (tamanho da janela em ms; default 60000)
 */
@Injectable()
export class WhatsappRateLimiter {
  private readonly logger = new Logger(WhatsappRateLimiter.name);
  private readonly limit: number;
  private readonly windowMs: number;
  /** tenantId -> timestamps (ms) dos envios dentro da janela. */
  private readonly hits = new Map<string, number[]>();

  constructor() {
    this.limit = positiveIntEnv('WHATSAPP_SEND_LIMIT', 20);
    this.windowMs = positiveIntEnv('WHATSAPP_SEND_WINDOW_MS', 60_000);
  }

  /**
   * Registra uma tentativa de envio e lança 429 se o tenant exceder o limite
   * na janela atual. Deve ser chamado imediatamente antes do envio real.
   */
  check(tenantId: string): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(tenantId) ?? []).filter(
      (t) => t > windowStart,
    );

    if (recent.length >= this.limit) {
      const retryMs = recent[0] + this.windowMs - now;
      const retryAfter = Math.max(1, Math.ceil(retryMs / 1000));
      this.logger.warn(
        `Rate limit de envio atingido para tenant ${tenantId} (${this.limit}/${this.windowMs}ms)`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Muitos envios em sequência. Tente novamente em ${retryAfter}s.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.hits.set(tenantId, recent);
  }
}

function positiveIntEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}
