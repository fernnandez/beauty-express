import {
  Body,
  Controller,
  ForbiddenException,
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
 * Endpoint público que recebe os eventos da Evolution API.
 * Protegido por um token secreto na query string (?token=...), configurado
 * em EVOLUTION_WEBHOOK_TOKEN e também na URL de webhook da instância.
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
    @Query('token') token?: string,
  ) {
    const expected = process.env.EVOLUTION_WEBHOOK_TOKEN;
    if (expected && token !== expected) {
      throw new ForbiddenException('Token de webhook inválido');
    }

    this.logger.debug(
      `webhook recebido: event=${payload.event} status=${payload.data?.status ?? '-'} msgId=${payload.data?.keyId ?? payload.data?.key?.id ?? '-'}`,
    );

    await this.whatsappService.processInboundWebhook(payload);
    return { received: true };
  }
}
