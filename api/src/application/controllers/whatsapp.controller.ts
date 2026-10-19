import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@domain/entities/user-role.enum';
import { WhatsappService } from '@domain/services/whatsapp.service';
import { SendMessageDto } from '../dtos/whatsapp/send-message.dto';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@Roles(UserRole.ADMIN)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('instance')
  @ApiOperation({ summary: 'Status da conexão de WhatsApp do estabelecimento' })
  async getInstance() {
    return await this.whatsappService.getInstanceStatus();
  }

  @Post('instance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar/garantir a instância de WhatsApp' })
  async createInstance() {
    return await this.whatsappService.createInstance();
  }

  @Get('instance/qr')
  @ApiOperation({ summary: 'Obter QR code para parear o WhatsApp' })
  async getQr() {
    return await this.whatsappService.getConnectionQr();
  }

  @Post('instance/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desconectar o número do WhatsApp' })
  async disconnect() {
    return await this.whatsappService.disconnectInstance();
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversas do inbox' })
  async listConversations(@Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : undefined;
    return await this.whatsappService.listConversations(parsed);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
  async listMessages(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : undefined;
    return await this.whatsappService.listMessages(id, parsed);
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar mensagem numa conversa' })
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return await this.whatsappService.sendMessage(id, dto.text);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar conversa como lida' })
  async markRead(@Param('id') id: string) {
    await this.whatsappService.markConversationRead(id);
  }
}
