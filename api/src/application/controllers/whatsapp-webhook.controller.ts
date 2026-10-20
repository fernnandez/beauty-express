import { timingSafeEqual } from 'crypto';
import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { WhatsappService } from '@domain/services/whatsapp.service';
import { EvolutionWebhookPayload } from '@domain/services/evolution-webhook.types';

/**
 * Compara duas strings em tempo constante (evita timing attacks).
 * Retorna false se tamanhos diferirem ou se algum valor for vazio.
 */
export function safeTokenEquals(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Endpoint público que recebe os eventos da Evolution API.
 *
 * Autenticação por token secreto (`EVOLUTION_WEBHOOK_TOKEN`), aceito via
 * query string (`?token=...`, usado pela Evolution ao montar a URL) ou via
 * header `x-webhook-token`. É *fail-closed*: se o token não estiver
 * configurado no ambiente, toda requisição é recusada.
 */
@ApiExcludeController()
@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Body() payload: EvolutionWebhookPayload,
    @Query('token') queryToken?: string,
    @Headers('x-webhook-token') headerToken?: string,
  ) {
    const expected = process.env.EVOLUTION_WEBHOOK_TOKEN;
    if (!expected) {
      // Fail-closed: sem token configurado, não aceitamos nada.
      this.logger.error(
        'EVOLUTION_WEBHOOK_TOKEN não configurado — webhook recusado',
      );
      throw new ForbiddenException('Webhook não configurado');
    }

    const provided = headerToken ?? queryToken ?? '';
    if (!safeTokenEquals(provided, expected)) {
      throw new ForbiddenException('Token de webhook inválido');
    }

    await this.whatsappService.processInboundWebhook(payload);
    return { received: true };
  }
}
