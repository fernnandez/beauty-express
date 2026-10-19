import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { WhatsappInstance } from '../entities/whatsapp-instance.entity';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
  WhatsappInstanceStatus,
} from '../entities/whatsapp-enums';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { WhatsappInstanceRepository } from '../repositories/whatsapp-instance.repository';
import { ClientRepository } from '../repositories/client.repository';
import { EvolutionClient } from './evolution.client';
import { EvolutionWebhookPayload } from './evolution-webhook.types';
import { TenantContextService } from './tenant-context.service';
import { normalizePhone } from '@common/utils/phone.util';

@Injectable({ scope: Scope.REQUEST })
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly instanceRepository: WhatsappInstanceRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly clientRepository: ClientRepository,
    private readonly evolution: EvolutionClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  // ---------------------------------------------------------------------------
  // Pareamento / conexão da instância
  // ---------------------------------------------------------------------------

  /** Nome determinístico da instância na Evolution para um tenant. */
  private instanceNameFor(tenantId: string): string {
    return `beauty-${tenantId}`;
  }

  /** Monta a URL pública do webhook (com token) a partir de env. */
  private buildWebhookUrl(): string {
    const base = (
      process.env.EVOLUTION_WEBHOOK_PUBLIC_URL ??
      process.env.PUBLIC_API_URL ??
      ''
    ).replace(/\/+$/, '');
    if (!base) {
      throw new BadRequestException(
        'EVOLUTION_WEBHOOK_PUBLIC_URL não configurada',
      );
    }
    const token = process.env.EVOLUTION_WEBHOOK_TOKEN;
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${base}/webhooks/whatsapp${query}`;
  }

  /** Retorna a instância do tenant, criando o registro local se necessário. */
  async getOrCreateInstance(): Promise<WhatsappInstance> {
    const tenantId = this.getTenantId();
    const existing = await this.instanceRepository.findByTenant(tenantId);
    if (existing) {
      return existing;
    }
    const instance = this.instanceRepository.create({
      tenantId,
      instanceName: this.instanceNameFor(tenantId),
      status: WhatsappInstanceStatus.DISCONNECTED,
    });
    return await this.instanceRepository.save(instance);
  }

  /** Cria/garante a instância na Evolution e devolve o estado atual. */
  async createInstance(): Promise<WhatsappInstance> {
    const instance = await this.getOrCreateInstance();
    const webhookUrl = this.buildWebhookUrl();
    try {
      await this.evolution.createInstance(instance.instanceName, webhookUrl);
    } catch (err) {
      // Instância pode já existir na Evolution; apenas (re)configura o webhook.
      this.logger.warn(
        `createInstance falhou (seguindo com setWebhook): ${String(err)}`,
      );
      await this.evolution.setWebhook(instance.instanceName, webhookUrl);
    }
    instance.status = WhatsappInstanceStatus.CONNECTING;
    return await this.instanceRepository.save(instance);
  }

  /** Obtém o QR code / código de pareamento para conectar o número. */
  async getConnectionQr(): Promise<{ base64?: string; code?: string }> {
    const instance = await this.getOrCreateInstance();
    const result = await this.evolution.connect(instance.instanceName);
    return {
      base64: result.base64,
      code: result.code ?? result.pairingCode,
    };
  }

  /** Estado local da conexão da instância do tenant. */
  async getInstanceStatus(): Promise<{
    status: WhatsappInstanceStatus;
    phoneNormalized?: string | null;
  }> {
    const instance = await this.getOrCreateInstance();
    return {
      status: instance.status,
      phoneNormalized: instance.phoneNormalized,
    };
  }

  /** Desconecta (logout) o número do WhatsApp e marca como desconectado. */
  async disconnectInstance(): Promise<WhatsappInstance> {
    const tenantId = this.getTenantId();
    const instance = await this.instanceRepository.findByTenant(tenantId);
    if (!instance) {
      throw new BadRequestException('Nenhuma instância para desconectar');
    }
    try {
      await this.evolution.logout(instance.instanceName);
    } catch (err) {
      this.logger.warn(`Logout da Evolution falhou: ${String(err)}`);
    }
    instance.status = WhatsappInstanceStatus.DISCONNECTED;
    instance.phoneNormalized = null;
    return await this.instanceRepository.save(instance);
  }

  // ---------------------------------------------------------------------------
  // Inbox (autenticado, request-scoped)
  // ---------------------------------------------------------------------------

  async listConversations(limit = 50): Promise<Conversation[]> {
    return await this.conversationRepository.listByTenant(
      this.getTenantId(),
      limit,
    );
  }

  async listMessages(conversationId: string, limit = 100): Promise<Message[]> {
    const tenantId = this.getTenantId();
    const conversation = await this.conversationRepository.findById(
      conversationId,
      tenantId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    return await this.messageRepository.listByConversation(
      conversationId,
      tenantId,
      limit,
    );
  }

  /** Envia uma mensagem de texto numa conversa e grava o espelho outbound. */
  async sendMessage(conversationId: string, text: string): Promise<Message> {
    const tenantId = this.getTenantId();
    const trimmed = text?.trim();
    if (!trimmed) {
      throw new BadRequestException('Mensagem vazia');
    }

    const conversation = await this.conversationRepository.findById(
      conversationId,
      tenantId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    const instance = await this.instanceRepository.findByTenant(tenantId);
    if (!instance) {
      throw new BadRequestException(
        'Nenhuma instância de WhatsApp conectada para este estabelecimento',
      );
    }

    let status = MessageStatus.SENT;
    let waMessageId: string | null = null;
    try {
      const result = await this.evolution.sendText(
        instance.instanceName,
        conversation.phoneNormalized,
        trimmed,
      );
      waMessageId = result?.key?.id ?? null;
    } catch (err) {
      this.logger.error(
        `Falha ao enviar WhatsApp (conversa ${conversationId}): ${String(err)}`,
      );
      status = MessageStatus.FAILED;
    }

    const message = this.messageRepository.create({
      tenantId,
      conversationId,
      waMessageId,
      direction: MessageDirection.OUTBOUND,
      type: MessageType.TEXT,
      content: trimmed,
      status,
      sentByUserId: this.tenantContext.getUserId(),
      timestamp: new Date(),
    });
    const saved = await this.messageRepository.save(message);

    conversation.lastMessagePreview = trimmed.slice(0, 120);
    conversation.lastMessageAt = saved.timestamp;
    await this.conversationRepository.save(conversation);

    if (status === MessageStatus.FAILED) {
      throw new BadRequestException('Não foi possível enviar a mensagem');
    }
    return saved;
  }

  /** Marca as mensagens recebidas de uma conversa como lidas (zera unread). */
  async markConversationRead(conversationId: string): Promise<void> {
    const tenantId = this.getTenantId();
    const conversation = await this.conversationRepository.findById(
      conversationId,
      tenantId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    conversation.unreadCount = 0;
    await this.conversationRepository.save(conversation);
  }

  // ---------------------------------------------------------------------------
  // Webhook (público) — resolve o tenant pela instância, não usa TenantContext
  // ---------------------------------------------------------------------------

  /**
   * Processa um evento de mensagem recebida da Evolution.
   * Idempotente: ignora mensagens já gravadas (dedupe por waMessageId).
   * Retorna a mensagem criada, ou null quando ignorada.
   */
  async processInboundWebhook(
    payload: EvolutionWebhookPayload,
  ): Promise<Message | null> {
    const event = payload.event?.toLowerCase();

    if (event === 'connection.update' || event === 'connection_update') {
      await this.handleConnectionUpdate(payload);
      return null;
    }

    if (event && event !== 'messages.upsert' && event !== 'messages_upsert') {
      return null;
    }

    const instanceName = payload.instance;
    if (!instanceName) {
      return null;
    }

    const instance =
      await this.instanceRepository.findByInstanceName(instanceName);
    if (!instance) {
      this.logger.warn(`Webhook de instância desconhecida: ${instanceName}`);
      return null;
    }
    const tenantId = instance.tenantId;

    const data = payload.data;
    const remoteJid = data?.key?.remoteJid;
    if (!data || !remoteJid) {
      return null;
    }

    // Ignora grupos e mensagens enviadas por nós (eco).
    if (remoteJid.endsWith('@g.us') || data.key?.fromMe) {
      return null;
    }

    const waMessageId = data.key?.id ?? null;
    if (waMessageId) {
      const existing = await this.messageRepository.findByWaMessageId(
        waMessageId,
        tenantId,
      );
      if (existing) {
        return null; // dedupe
      }
    }

    const text = this.extractText(data);
    const type = this.extractType(data);
    const phoneNormalized = normalizePhone(remoteJid.split('@')[0] ?? '');
    const timestamp = this.extractTimestamp(data);

    // Mídia visual (imagem/figurinha): a URL do WhatsApp é criptografada,
    // então pedimos à Evolution o conteúdo descriptografado em base64.
    let mediaUrl: string | null = null;
    const isVisualMedia =
      type === MessageType.IMAGE || type === MessageType.STICKER;
    if (isVisualMedia && waMessageId) {
      mediaUrl = await this.fetchMediaDataUrl(
        instance.instanceName,
        waMessageId,
      );
    }

    const conversation = await this.getOrCreateConversation(
      tenantId,
      remoteJid,
      phoneNormalized,
      data.pushName ?? null,
    );

    const message = this.messageRepository.create({
      tenantId,
      conversationId: conversation.id,
      waMessageId,
      direction: MessageDirection.INBOUND,
      type,
      content: text,
      mediaUrl,
      status: MessageStatus.DELIVERED,
      timestamp,
    });
    const saved = await this.messageRepository.save(message);

    conversation.lastMessagePreview = (text ?? this.mediaLabel(type)).slice(
      0,
      120,
    );
    conversation.lastMessageAt = timestamp;
    conversation.unreadCount = (conversation.unreadCount ?? 0) + 1;
    if (!conversation.contactName && data.pushName) {
      conversation.contactName = data.pushName;
    }
    await this.conversationRepository.save(conversation);

    return saved;
  }

  /** Atualiza o status local da instância a partir de connection.update. */
  private async handleConnectionUpdate(
    payload: EvolutionWebhookPayload,
  ): Promise<void> {
    const instanceName = payload.instance;
    if (!instanceName) return;
    const instance =
      await this.instanceRepository.findByInstanceName(instanceName);
    if (!instance) return;

    const state = payload.data?.state?.toLowerCase();
    if (state === 'open') {
      instance.status = WhatsappInstanceStatus.CONNECTED;
    } else if (state === 'connecting') {
      instance.status = WhatsappInstanceStatus.CONNECTING;
    } else if (state === 'close') {
      instance.status = WhatsappInstanceStatus.DISCONNECTED;
    }
    await this.instanceRepository.save(instance);
  }

  private async getOrCreateConversation(
    tenantId: string,
    waChatId: string,
    phoneNormalized: string,
    contactName: string | null,
  ): Promise<Conversation> {
    const existing = await this.conversationRepository.findByWaChatId(
      waChatId,
      tenantId,
    );
    if (existing) {
      return existing;
    }

    // Tenta casar com um cliente cadastrado pelo telefone.
    const client = phoneNormalized
      ? await this.clientRepository.findByPhoneNormalized(
          phoneNormalized,
          tenantId,
        )
      : null;

    const conversation = this.conversationRepository.create({
      tenantId,
      waChatId,
      phoneNormalized,
      contactName: client?.name ?? contactName,
      clientId: client?.id ?? null,
      unreadCount: 0,
    });
    return await this.conversationRepository.save(conversation);
  }
  /** Busca a mídia descriptografada e monta um data URL, ou null em falha. */
  private async fetchMediaDataUrl(
    instanceName: string,
    waMessageId: string,
  ): Promise<string | null> {
    try {
      const media = await this.evolution.getMediaBase64(
        instanceName,
        waMessageId,
      );
      if (!media?.base64) return null;
      const mime = media.mimetype || 'image/webp';
      return `data:${mime};base64,${media.base64}`;
    } catch (err) {
      this.logger.warn(`Falha ao baixar mídia ${waMessageId}: ${String(err)}`);
      return null;
    }
  }

  private extractText(
    data: NonNullable<EvolutionWebhookPayload['data']>,
  ): string | null {
    const m = data.message;
    if (!m) return null;
    return (
      m.conversation ??
      m.extendedTextMessage?.text ??
      m.imageMessage?.caption ??
      m.videoMessage?.caption ??
      m.documentMessage?.fileName ??
      null
    );
  }

  private extractType(
    data: NonNullable<EvolutionWebhookPayload['data']>,
  ): MessageType {
    const m = data.message;
    if (!m) return MessageType.UNKNOWN;
    if (m.conversation || m.extendedTextMessage) return MessageType.TEXT;
    if (m.imageMessage) return MessageType.IMAGE;
    if (m.stickerMessage) return MessageType.STICKER;
    if (m.audioMessage) return MessageType.AUDIO;
    if (m.videoMessage) return MessageType.VIDEO;
    if (m.documentMessage) return MessageType.DOCUMENT;
    return MessageType.UNKNOWN;
  }

  /** Rótulo amigável para prévia de mensagens de mídia. */
  private mediaLabel(type: MessageType): string {
    const labels: Partial<Record<MessageType, string>> = {
      [MessageType.IMAGE]: '[imagem]',
      [MessageType.STICKER]: '[figurinha]',
      [MessageType.AUDIO]: '[áudio]',
      [MessageType.VIDEO]: '[vídeo]',
      [MessageType.DOCUMENT]: '[arquivo]',
      [MessageType.LOCATION]: '[localização]',
      [MessageType.CONTACT]: '[contato]',
    };
    return labels[type] ?? '[mensagem]';
  }

  private extractTimestamp(
    data: NonNullable<EvolutionWebhookPayload['data']>,
  ): Date {
    const ts = data.messageTimestamp;
    if (ts === undefined || ts === null) return new Date();
    const seconds = typeof ts === 'string' ? Number.parseInt(ts, 10) : ts;
    if (!Number.isFinite(seconds)) return new Date();
    return new Date(seconds * 1000);
  }
}
