import { ForbiddenException } from '@nestjs/common';
import {
  WhatsappWebhookController,
  safeTokenEquals,
} from './whatsapp-webhook.controller';
import { WhatsappService } from '@domain/services/whatsapp.service';
import { EvolutionWebhookPayload } from '@domain/services/evolution-webhook.types';

describe('WhatsappWebhookController', () => {
  let controller: WhatsappWebhookController;
  let service: { processInboundWebhook: jest.Mock };
  const ORIGINAL_TOKEN = process.env.EVOLUTION_WEBHOOK_TOKEN;

  const payload = {
    event: 'messages.upsert',
    instance: 'beauty-tenant-1',
    data: {},
  } as unknown as EvolutionWebhookPayload;

  beforeEach(() => {
    service = { processInboundWebhook: jest.fn().mockResolvedValue(undefined) };
    controller = new WhatsappWebhookController(
      service as unknown as WhatsappService,
    );
  });

  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.EVOLUTION_WEBHOOK_TOKEN;
    } else {
      process.env.EVOLUTION_WEBHOOK_TOKEN = ORIGINAL_TOKEN;
    }
  });

  describe('safeTokenEquals', () => {
    it('retorna true para tokens iguais', () => {
      expect(safeTokenEquals('abc123', 'abc123')).toBe(true);
    });
    it('retorna false para tokens diferentes', () => {
      expect(safeTokenEquals('abc123', 'xyz789')).toBe(false);
    });
    it('retorna false para tamanhos diferentes', () => {
      expect(safeTokenEquals('abc', 'abc123')).toBe(false);
    });
    it('retorna false para valores vazios', () => {
      expect(safeTokenEquals('', 'abc')).toBe(false);
      expect(safeTokenEquals('abc', '')).toBe(false);
    });
  });

  it('recusa (fail-closed) quando EVOLUTION_WEBHOOK_TOKEN não está configurado', async () => {
    delete process.env.EVOLUTION_WEBHOOK_TOKEN;
    await expect(
      controller.receive(payload, 'qualquer'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.processInboundWebhook).not.toHaveBeenCalled();
  });

  it('recusa token inválido', async () => {
    process.env.EVOLUTION_WEBHOOK_TOKEN = 'segredo';
    await expect(controller.receive(payload, 'errado')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(service.processInboundWebhook).not.toHaveBeenCalled();
  });

  it('aceita token válido na query string', async () => {
    process.env.EVOLUTION_WEBHOOK_TOKEN = 'segredo';
    const result = await controller.receive(payload, 'segredo');
    expect(result).toEqual({ received: true });
    expect(service.processInboundWebhook).toHaveBeenCalledWith(payload);
  });

  it('aceita token válido no header x-webhook-token', async () => {
    process.env.EVOLUTION_WEBHOOK_TOKEN = 'segredo';
    const result = await controller.receive(payload, undefined, 'segredo');
    expect(result).toEqual({ received: true });
    expect(service.processInboundWebhook).toHaveBeenCalledWith(payload);
  });

  it('o header tem precedência sobre a query', async () => {
    process.env.EVOLUTION_WEBHOOK_TOKEN = 'segredo';
    // query errada, header certo → aceita
    const result = await controller.receive(payload, 'errado', 'segredo');
    expect(result).toEqual({ received: true });
  });
});
