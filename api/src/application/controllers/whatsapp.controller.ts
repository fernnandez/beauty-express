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
import {
  LinkConversationDto,
  StartConversationDto,
} from '../dtos/whatsapp/conversation-link.dto';
import { ReactMessageDto } from '../dtos/whatsapp/react-message.dto';

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

  @Get('unread-count')
  @ApiOperation({ summary: 'Total de conversas com mensagens não lidas' })
  async unreadCount() {
    return await this.whatsappService.getUnreadCount();
  }

  @Post('conversations/from-client')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar conversa com um cliente cadastrado' })
  async startWithClient(@Body() dto: StartConversationDto) {
    return await this.whatsappService.startConversationWithClient(dto.clientId);
  }

  @Post('conversations/:id/link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vincular a conversa a um cliente cadastrado' })
  async linkToClient(
    @Param('id') id: string,
    @Body() dto: LinkConversationDto,
  ) {
    return await this.whatsappService.linkConversationToClient(
      id,
      dto.clientId,
    );
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

  @Get('price-list/preview')
  @ApiOperation({ summary: 'Gerar o texto do catálogo a partir dos serviços' })
  async priceListPreview() {
    return { message: await this.whatsappService.buildPriceListText() };
  }

  @Post('appointments/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preparar confirmação de um agendamento (abre o chat com o texto)',
  })
  async confirmAppointment(@Param('id') id: string) {
    return await this.whatsappService.prepareAppointmentConfirmation(id);
  }

  @Post('messages/:id/react')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reagir (emoji) a uma mensagem' })
  async reactToMessage(@Param('id') id: string, @Body() dto: ReactMessageDto) {
    return await this.whatsappService.reactToMessage(id, dto.emoji);
  }
}
