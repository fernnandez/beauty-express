import {
  BadRequestException,
  Inject,
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
import { ServiceRepository } from '../repositories/service.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { EvolutionClient } from './evolution.client';
import type { EvolutionSendResponse } from './evolution.client';
import { WhatsappGateway } from './whatsapp.gateway';
import { WhatsappRateLimiter } from './whatsapp-rate-limiter.service';
import { EvolutionWebhookPayload } from './evolution-webhook.types';
import { TenantContextService } from './tenant-context.service';
import {
  MEDIA_STORAGE,
  MediaStorage,
} from './media-storage/media-storage.interface';
import { normalizePhone } from '@common/utils/phone.util';

/** Bucket derivado do vínculo da conversa com cliente/agendamentos. */
export type ConversationCategory = 'scheduled' | 'client' | 'lead';

export type ConversationWithCategory = Conversation & {
  category: ConversationCategory;
};

@Injectable({ scope: Scope.REQUEST })
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly instanceRepository: WhatsappInstanceRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly clientRepository: ClientRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly evolution: EvolutionClient,
    private readonly gateway: WhatsappGateway,
    private readonly rateLimiter: WhatsappRateLimiter,
    private readonly tenantContext: TenantContextService,
    @Inject(MEDIA_STORAGE)
    private readonly mediaStorage: MediaStorage,
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

  async listConversations(limit = 50): Promise<ConversationWithCategory[]> {
    const tenantId = this.getTenantId();
    const conversations = await this.conversationRepository.listByTenant(
      tenantId,
      limit,
    );

    const upcomingClientIds = new Set(
      await this.appointmentRepository.findClientIdsWithUpcoming(tenantId),
    );

    return conversations.map((c) => ({
      ...c,
      category: this.resolveCategory(c, upcomingClientIds),
    }));
  }

  /** Nº de conversas com mensagens não lidas (para o badge da sidebar). */
  async getUnreadCount(): Promise<{ count: number }> {
    const count = await this.conversationRepository.countUnreadConversations(
      this.getTenantId(),
    );
    return { count };
  }

  /** Classifica a conversa em um bucket a partir do vínculo com o cliente. */
  private resolveCategory(
    conversation: Conversation,
    upcomingClientIds: Set<string>,
  ): ConversationCategory {
    if (!conversation.clientId) {
      return 'lead';
    }
    if (upcomingClientIds.has(conversation.clientId)) {
      return 'scheduled';
    }
    return 'client';
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
    const messages = await this.messageRepository.listByConversation(
      conversationId,
      tenantId,
      limit,
    );

    // Resolve a URL servível da mídia (presigned no S3) sob demanda.
    await Promise.all(
      messages.map(async (m) => {
        if (m.mediaUrl) {
          m.mediaUrl = await this.mediaStorage.resolveUrl(m.mediaUrl);
        }
      }),
    );

    return messages;
  }

  /**
   * Baixa a mídia de uma mensagem sob demanda (lazy), persiste e retorna a URL
   * servível (presigned). Usado para mídias importadas pelo sync, que não são
   * baixadas em massa. Idempotente: se já tem mediaUrl, apenas re-resolve.
   */
  async resolveMessageMedia(
    messageId: string,
  ): Promise<{ url: string | null }> {
    const tenantId = this.getTenantId();
    const message = await this.messageRepository.findById(messageId, tenantId);
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Já baixada: só re-assina a URL.
    if (message.mediaUrl) {
      return { url: await this.mediaStorage.resolveUrl(message.mediaUrl) };
    }

    const isDownloadableMedia =
      message.type === MessageType.IMAGE ||
      message.type === MessageType.STICKER ||
      message.type === MessageType.AUDIO ||
      message.type === MessageType.VIDEO ||
      message.type === MessageType.DOCUMENT;
    if (!isDownloadableMedia || !message.waMessageId) {
      return { url: null };
    }

    const instance = await this.instanceRepository.findByTenant(tenantId);
    if (!instance) {
      return { url: null };
    }

    const stored = await this.fetchMediaDataUrl(
      instance.instanceName,
      message.waMessageId,
      tenantId,
      message.type,
    );
    if (!stored) {
      return { url: null };
    }

    message.mediaUrl = stored;
    await this.messageRepository.save(message);
    return { url: await this.mediaStorage.resolveUrl(stored) };
  }

  /**
   * Importa o histórico recente de uma conversa a partir do aparelho (Evolution
   * findMessages), gravando mensagens que ainda não existem localmente. Traz
   * tanto recebidas quanto enviadas pelo celular (fromMe). Idempotente (dedupe
   * por waMessageId). Baixa mídia visual sob demanda.
   */
  async syncConversation(
    conversationId: string,
    page = 1,
  ): Promise<{ imported: number }> {
    const tenantId = this.getTenantId();
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

    const result = await this.evolution.findMessages(
      instance.instanceName,
      conversation.waChatId,
      page,
    );
    const records = result.messages?.records ?? [];

    let imported = 0;
    let latestTimestamp = conversation.lastMessageAt ?? null;
    let latestPreview: string | null = null;

    for (const record of records) {
      const data = record as unknown as NonNullable<
        EvolutionWebhookPayload['data']
      >;

      // Reação no histórico: aplica à mensagem-alvo em vez de gravar como msg.
      const reaction = data.message?.reactionMessage;
      if (reaction) {
        await this.applyReaction(
          tenantId,
          reaction.key?.id ?? null,
          reaction.text ?? '',
        );
        continue;
      }

      const waMessageId = record.key?.id ?? null;
      if (!waMessageId) continue;

      const existing = await this.messageRepository.findByWaMessageId(
        waMessageId,
        tenantId,
      );
      if (existing) continue; // dedupe

      // Os helpers de extração esperam o mesmo shape do webhook (.message /
      // .messageTimestamp), que o registro do histórico também possui.
      const text = this.extractText(data);
      const type = this.extractType(data);
      const timestamp = this.extractTimestamp(data);
      const quote = this.extractQuote(data);
      const fromMe = record.key?.fromMe === true;

      // Importação não baixa mídia (evita rajada de downloads/uploads e custo):
      // a mídia é baixada sob demanda ao abrir a conversa (resolveMessageMedia).
      await this.messageRepository.save(
        this.messageRepository.create({
          tenantId,
          conversationId: conversation.id,
          waMessageId,
          direction: fromMe
            ? MessageDirection.OUTBOUND
            : MessageDirection.INBOUND,
          type,
          content: text,
          mediaUrl: null,
          quotedWaMessageId: quote.quotedWaMessageId,
          quotedPreview: quote.quotedPreview,
          status: MessageStatus.DELIVERED,
          timestamp,
        }),
      );
      imported += 1;

      if (!latestTimestamp || timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
        latestPreview = text ?? this.mediaLabel(type);
      }
    }

    if (imported > 0) {
      if (latestTimestamp) conversation.lastMessageAt = latestTimestamp;
      if (latestPreview) {
        conversation.lastMessagePreview = latestPreview.slice(0, 120);
      }
      await this.conversationRepository.save(conversation);
      this.gateway.emitInboxUpdate(tenantId, {
        conversationId: conversation.id,
        kind: 'sync',
      });
    }

    return { imported };
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

    // Protege o número contra rajadas (risco de ban no WhatsApp não-oficial).
    this.rateLimiter.check(tenantId);

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

    this.gateway.emitInboxUpdate(tenantId, {
      conversationId,
      kind: 'outbound',
    });

    if (status === MessageStatus.FAILED) {
      throw new BadRequestException('Não foi possível enviar a mensagem');
    }
    return saved;
  }

  /**
   * Envia mídia (imagem/áudio/vídeo/documento) numa conversa: valida, respeita
   * o rate limit, envia pela Evolution, persiste a mídia no storage e grava a
   * mensagem outbound.
   */
  async sendMediaMessage(
    conversationId: string,
    input: {
      base64: string;
      mime: string;
      type: MessageType;
      fileName?: string;
      caption?: string;
    },
  ): Promise<Message> {
    const tenantId = this.getTenantId();
    if (!input.base64) {
      throw new BadRequestException('Arquivo vazio');
    }

    // Limite de tamanho (mesmo do recebimento).
    const approxBytes = Math.floor((input.base64.length * 3) / 4);
    const maxBytes = this.mediaMaxBytes();
    if (maxBytes > 0 && approxBytes > maxBytes) {
      throw new BadRequestException(
        `Arquivo excede o limite de ${Math.round(maxBytes / 1024 / 1024)}MB`,
      );
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

    this.rateLimiter.check(tenantId);

    const caption = input.caption?.trim() || undefined;
    const fileName = input.fileName || `arquivo.${this.extFor(input.mime)}`;

    let status = MessageStatus.SENT;
    let waMessageId: string | null = null;
    try {
      let result: EvolutionSendResponse;
      if (input.type === MessageType.AUDIO) {
        result = await this.evolution.sendWhatsAppAudio(
          instance.instanceName,
          conversation.phoneNormalized,
          input.base64,
        );
      } else {
        const mediatype =
          input.type === MessageType.VIDEO
            ? 'video'
            : input.type === MessageType.DOCUMENT
              ? 'document'
              : 'image';
        result = await this.evolution.sendMedia(
          instance.instanceName,
          conversation.phoneNormalized,
          {
            mediatype,
            mimetype: input.mime,
            base64: input.base64,
            fileName,
            caption,
          },
        );
      }
      waMessageId = result?.key?.id ?? null;
    } catch (err) {
      this.logger.error(
        `Falha ao enviar mídia (conversa ${conversationId}): ${String(err)}`,
      );
      status = MessageStatus.FAILED;
    }

    // Persiste a mídia enviada no storage (para reexibir no histórico).
    let mediaUrl: string | null = null;
    if (status !== MessageStatus.FAILED) {
      try {
        mediaUrl = await this.mediaStorage.store({
          base64: input.base64,
          mime: input.mime,
          tenantId,
          waMessageId: waMessageId ?? `out-${Date.now()}`,
        });
      } catch (err) {
        this.logger.warn(`Falha ao armazenar mídia enviada: ${String(err)}`);
      }
    }

    const saved = await this.messageRepository.save(
      this.messageRepository.create({
        tenantId,
        conversationId,
        waMessageId,
        direction: MessageDirection.OUTBOUND,
        type: input.type,
        content: caption ?? null,
        mediaUrl,
        status,
        sentByUserId: this.tenantContext.getUserId(),
        timestamp: new Date(),
      }),
    );

    conversation.lastMessagePreview = (
      caption ?? this.mediaLabel(input.type)
    ).slice(0, 120);
    conversation.lastMessageAt = saved.timestamp;
    await this.conversationRepository.save(conversation);

    this.gateway.emitInboxUpdate(tenantId, {
      conversationId,
      kind: 'outbound',
    });

    if (status === MessageStatus.FAILED) {
      throw new BadRequestException('Não foi possível enviar a mídia');
    }
    // Resolve a URL servível (presigned) antes de devolver.
    if (saved.mediaUrl) {
      saved.mediaUrl = await this.mediaStorage.resolveUrl(saved.mediaUrl);
    }
    return saved;
  }

  /** Extensão padrão por mime (para nome de arquivo de envio). */
  private extFor(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'application/pdf': 'pdf',
    };
    return map[mime] ?? 'bin';
  }
  async buildPriceListText(): Promise<string> {
    const tenantId = this.getTenantId();
    const services = await this.serviceRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });

    if (services.length === 0) {
      throw new BadRequestException(
        'Nenhum serviço cadastrado para montar a tabela de preços',
      );
    }

    const lines = services.map((s) => {
      const price = Number(s.defaultPrice).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
      return `• ${s.name} — ${price}`;
    });

    return [
      '*Tabela de serviços e preços*',
      '',
      ...lines,
      '',
      'Qualquer dúvida ou para agendar, é só chamar! 😊',
    ].join('\n');
  }
  /** Reage (emoji) a uma mensagem pelo inbox: envia à Evolution e grava local. */
  async reactToMessage(messageId: string, emoji: string): Promise<Message> {
    const tenantId = this.getTenantId();
    const message = await this.messageRepository.findById(messageId, tenantId);
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }
    const conversation = await this.conversationRepository.findById(
      message.conversationId,
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
    if (!message.waMessageId) {
      throw new BadRequestException('Mensagem sem identificador do WhatsApp');
    }

    this.rateLimiter.check(tenantId);

    try {
      await this.evolution.sendReaction(
        instance.instanceName,
        conversation.waChatId,
        message.direction === MessageDirection.OUTBOUND,
        message.waMessageId,
        emoji,
      );
    } catch (err) {
      this.logger.error(`Falha ao reagir (msg ${messageId}): ${String(err)}`);
      throw new BadRequestException('Não foi possível enviar a reação');
    }

    message.reaction = emoji ? emoji : null;
    return await this.messageRepository.save(message);
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

  /**
   * Inicia (ou reabre) uma conversa com um cliente cadastrado, pelo telefone.
   * Usado para começar o contato quando ainda não há conversa — base de disparos.
   */
  async startConversationWithClient(clientId: string): Promise<Conversation> {
    const tenantId = this.getTenantId();
    const client = await this.clientRepository.findById(clientId, tenantId);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    const phoneNormalized = normalizePhone(client.phoneNormalized);
    if (!phoneNormalized) {
      throw new BadRequestException('Cliente sem telefone válido');
    }

    const waChatId = `${phoneNormalized}@s.whatsapp.net`;
    const existing = await this.conversationRepository.findByWaChatId(
      waChatId,
      tenantId,
    );
    if (existing) {
      // Garante o vínculo caso a conversa tenha sido criada como lead antes.
      if (!existing.clientId) {
        existing.clientId = client.id;
        existing.contactName = client.name;
        await this.conversationRepository.save(existing);
      }
      return existing;
    }

    const conversation = this.conversationRepository.create({
      tenantId,
      waChatId,
      phoneNormalized,
      contactName: client.name,
      clientId: client.id,
      unreadCount: 0,
    });
    return await this.conversationRepository.save(conversation);
  }

  /** Vincula uma conversa (ex.: um contato novo) a um cliente cadastrado. */
  async linkConversationToClient(
    conversationId: string,
    clientId: string,
  ): Promise<Conversation> {
    const tenantId = this.getTenantId();
    const conversation = await this.conversationRepository.findById(
      conversationId,
      tenantId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    const client = await this.clientRepository.findById(clientId, tenantId);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    conversation.clientId = client.id;
    conversation.contactName = client.name;
    return await this.conversationRepository.save(conversation);
  }

  /**
   * Prepara a confirmação de um agendamento: cria/abre a conversa pelo
   * telefone e devolve o texto sugerido (sem enviar — o atendente revisa e manda).
   */
  async prepareAppointmentConfirmation(
    appointmentId: string,
  ): Promise<{ conversation: Conversation; text: string }> {
    const tenantId = this.getTenantId();
    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const phoneNormalized = normalizePhone(appointment.clientPhone ?? '');
    if (!phoneNormalized) {
      throw new BadRequestException('Agendamento sem telefone válido');
    }

    const waChatId = `${phoneNormalized}@s.whatsapp.net`;
    const conversation = await this.getOrCreateConversation(
      tenantId,
      waChatId,
      phoneNormalized,
      appointment.clientName ?? null,
    );
    if (appointment.clientId && !conversation.clientId) {
      conversation.clientId = appointment.clientId;
      await this.conversationRepository.save(conversation);
    }

    const text = this.buildConfirmationMessage(appointment);
    return { conversation, text };
  }

  /** Texto de confirmação a partir dos dados do agendamento. */
  private buildConfirmationMessage(appointment: {
    clientName?: string;
    date: Date;
    startTime: string;
    scheduledServices?: Array<{ service?: { name?: string } }>;
  }): string {
    const firstName = (appointment.clientName ?? '').split(' ')[0] || 'Olá';
    const date = new Date(appointment.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
    const services = (appointment.scheduledServices ?? [])
      .map((s) => s.service?.name)
      .filter((n): n is string => !!n);

    const lines = [
      `Oi, ${firstName}! Tudo bem? 😊`,
      '',
      `Passando para confirmar o seu horário no dia *${date}* às *${appointment.startTime}*.`,
    ];
    if (services.length > 0) {
      lines.push(`Serviço(s): ${services.join(', ')}.`);
    }
    lines.push(
      '',
      'Podemos confirmar? Qualquer coisa, é só responder por aqui!',
    );
    return lines.join('\n');
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

    if (event === 'messages.update' || event === 'messages_update') {
      await this.handleMessageStatusUpdate(payload);
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

    // Ignora grupos.
    if (remoteJid.endsWith('@g.us')) {
      return null;
    }

    // Reação: não é uma mensagem nova — anexa/retira o emoji na mensagem-alvo.
    const reaction = data.message?.reactionMessage;
    if (reaction) {
      await this.applyReaction(
        tenantId,
        reaction.key?.id ?? null,
        reaction.text ?? '',
      );
      return null;
    }

    // Dedupe por waMessageId: pula tanto o eco das nossas mensagens enviadas
    // pelo sistema quanto reprocessamento de webhooks.
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

    // fromMe = mensagem enviada pelo próprio aparelho (ex.: digitada no
    // celular). Capturamos como OUTBOUND para espelhar o histórico real.
    const fromMe = data.key?.fromMe === true;
    const direction = fromMe
      ? MessageDirection.OUTBOUND
      : MessageDirection.INBOUND;

    const text = this.extractText(data);
    const quote = this.extractQuote(data);
    const type = this.extractType(data);
    const phoneNormalized = normalizePhone(remoteJid.split('@')[0] ?? '');
    const timestamp = this.extractTimestamp(data);

    // Mídia com conteúdo binário (imagem/figurinha/áudio/vídeo/documento): a
    // URL do WhatsApp é criptografada, então pedimos à Evolution o conteúdo
    // descriptografado em base64.
    let mediaUrl: string | null = null;
    const isDownloadableMedia =
      type === MessageType.IMAGE ||
      type === MessageType.STICKER ||
      type === MessageType.AUDIO ||
      type === MessageType.VIDEO ||
      type === MessageType.DOCUMENT;
    if (isDownloadableMedia && waMessageId) {
      mediaUrl = await this.fetchMediaDataUrl(
        instance.instanceName,
        waMessageId,
        tenantId,
        type,
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
      direction,
      type,
      content: text,
      mediaUrl,
      quotedWaMessageId: quote.quotedWaMessageId,
      quotedPreview: quote.quotedPreview,
      status: MessageStatus.DELIVERED,
      timestamp,
    });
    const saved = await this.messageRepository.save(message);

    conversation.lastMessagePreview = (text ?? this.mediaLabel(type)).slice(
      0,
      120,
    );
    conversation.lastMessageAt = timestamp;
    // Só conta como não lida quando é uma mensagem recebida (não as que o
    // próprio estabelecimento enviou pelo celular).
    if (direction === MessageDirection.INBOUND) {
      conversation.unreadCount = (conversation.unreadCount ?? 0) + 1;
    }
    if (!conversation.contactName && data.pushName) {
      conversation.contactName = data.pushName;
    }
    await this.conversationRepository.save(conversation);

    this.gateway.emitInboxUpdate(tenantId, {
      conversationId: conversation.id,
      kind: 'inbound',
    });

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
    const previous = instance.status;
    if (state === 'open') {
      instance.status = WhatsappInstanceStatus.CONNECTED;
    } else if (state === 'connecting') {
      instance.status = WhatsappInstanceStatus.CONNECTING;
    } else if (state === 'close') {
      instance.status = WhatsappInstanceStatus.DISCONNECTED;
    }
    await this.instanceRepository.save(instance);

    // Avisa o front em tempo real quando o estado muda (ex.: queda do
    // aparelho, logout pelo próprio WhatsApp), para dar feedback imediato.
    if (instance.status !== previous) {
      this.gateway.emitConnectionUpdate(instance.tenantId, instance.status);
    }
  }

  /**
   * Atualiza o status de entrega de uma mensagem outbound a partir de
   * messages.update (SERVER_ACK/DELIVERY_ACK/READ...). Não rebaixa o status.
   */
  private async handleMessageStatusUpdate(
    payload: EvolutionWebhookPayload,
  ): Promise<void> {
    const instanceName = payload.instance;
    const data = payload.data;
    // No messages.update o payload é achatado: o id vem em data.keyId.
    const waMessageId = data?.keyId ?? data?.key?.id;
    const rawStatus = data?.status;
    if (!instanceName || !waMessageId || !rawStatus) return;

    const instance =
      await this.instanceRepository.findByInstanceName(instanceName);
    if (!instance) return;

    const next = this.mapWhatsappStatus(rawStatus);
    if (!next) return;

    const message = await this.messageRepository.findByWaMessageId(
      waMessageId,
      instance.tenantId,
    );
    if (!message || message.direction !== MessageDirection.OUTBOUND) return;

    // Só avança o status (sent < delivered < read); nunca rebaixa.
    if (this.statusRank(next) <= this.statusRank(message.status)) return;

    message.status = next;
    await this.messageRepository.save(message);
    this.gateway.emitInboxUpdate(instance.tenantId, {
      conversationId: message.conversationId,
      kind: 'status',
    });
  }

  /** Mapeia o status do WhatsApp/Evolution para o nosso enum. */
  private mapWhatsappStatus(raw: string): MessageStatus | null {
    switch (raw.toUpperCase()) {
      case 'PENDING':
        return MessageStatus.PENDING;
      case 'SERVER_ACK':
      case 'SENT':
        return MessageStatus.SENT;
      case 'DELIVERY_ACK':
      case 'DELIVERED':
        return MessageStatus.DELIVERED;
      case 'READ':
      case 'PLAYED':
        return MessageStatus.READ;
      default:
        return null;
    }
  }

  /**
   * Aplica (ou remove) a reação de emoji numa mensagem-alvo (por waMessageId).
   * Texto vazio = reação removida.
   */
  private async applyReaction(
    tenantId: string,
    targetWaMessageId: string | null,
    emoji: string,
  ): Promise<void> {
    if (!targetWaMessageId) return;
    const target = await this.messageRepository.findByWaMessageId(
      targetWaMessageId,
      tenantId,
    );
    if (!target) return;
    target.reaction = emoji ? emoji : null;
    await this.messageRepository.save(target);
    this.gateway.emitInboxUpdate(tenantId, {
      conversationId: target.conversationId,
      kind: 'reaction',
    });
  }

  /** Ordem de progressão dos status (para não rebaixar). */
  private statusRank(status: MessageStatus): number {
    const order: Record<string, number> = {
      [MessageStatus.FAILED]: 0,
      [MessageStatus.PENDING]: 1,
      [MessageStatus.SENT]: 2,
      [MessageStatus.DELIVERED]: 3,
      [MessageStatus.READ]: 4,
    };
    return order[status] ?? 0;
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
  /**
   * Busca a mídia descriptografada na Evolution e a persiste via MediaStorage,
   * retornando o valor a gravar em `mediaUrl` (data URL em dev, URL S3 em prod)
   * ou null em falha.
   */
  private async fetchMediaDataUrl(
    instanceName: string,
    waMessageId: string,
    tenantId: string,
    type: MessageType,
  ): Promise<string | null> {
    try {
      const media = await this.evolution.getMediaBase64(
        instanceName,
        waMessageId,
      );
      if (!media?.base64) return null;

      // Limite de tamanho: evita armazenar arquivos muito grandes (custo/ban).
      const approxBytes = Math.floor((media.base64.length * 3) / 4);
      const maxBytes = this.mediaMaxBytes();
      if (maxBytes > 0 && approxBytes > maxBytes) {
        this.logger.warn(
          `Mídia ${waMessageId} ignorada: ${Math.round(
            approxBytes / 1024 / 1024,
          )}MB excede o limite de ${Math.round(maxBytes / 1024 / 1024)}MB`,
        );
        return null;
      }

      const mime = media.mimetype || this.fallbackMimeFor(type);
      return await this.mediaStorage.store({
        base64: media.base64,
        mime,
        tenantId,
        waMessageId,
      });
    } catch (err) {
      this.logger.warn(`Falha ao baixar mídia ${waMessageId}: ${String(err)}`);
      return null;
    }
  }

  /** Limite de tamanho de mídia em bytes (0 = sem limite). Default 16MB. */
  private mediaMaxBytes(): number {
    const mb = Number(process.env.WHATSAPP_MEDIA_MAX_MB);
    const effective = Number.isFinite(mb) && mb >= 0 ? mb : 16;
    return Math.floor(effective * 1024 * 1024);
  }

  /** Mime padrão por tipo, caso a Evolution não informe o mimetype. */
  private fallbackMimeFor(type: MessageType): string {
    switch (type) {
      case MessageType.AUDIO:
        return 'audio/ogg';
      case MessageType.VIDEO:
        return 'video/mp4';
      case MessageType.IMAGE:
        return 'image/jpeg';
      case MessageType.STICKER:
        return 'image/webp';
      case MessageType.DOCUMENT:
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
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

  /**
   * Extrai a citação (reply) de uma mensagem, se houver: o waMessageId da
   * mensagem citada e uma prévia textual dela. Procura o contextInfo nas
   * submensagens que o suportam.
   */
  private extractQuote(data: NonNullable<EvolutionWebhookPayload['data']>): {
    quotedWaMessageId: string | null;
    quotedPreview: string | null;
  } {
    const m = data.message;
    const context =
      m?.extendedTextMessage?.contextInfo ??
      m?.imageMessage?.contextInfo ??
      m?.videoMessage?.contextInfo ??
      m?.audioMessage?.contextInfo ??
      m?.documentMessage?.contextInfo;

    if (!context?.stanzaId) {
      return { quotedWaMessageId: null, quotedPreview: null };
    }

    const q = context.quotedMessage;
    let preview: string | null = null;
    if (q) {
      if (q.conversation) preview = q.conversation;
      else if (q.extendedTextMessage?.text)
        preview = q.extendedTextMessage.text;
      else if (q.imageMessage) preview = q.imageMessage.caption || '[imagem]';
      else if (q.videoMessage) preview = q.videoMessage.caption || '[vídeo]';
      else if (q.audioMessage) preview = '[áudio]';
      else if (q.stickerMessage) preview = '[figurinha]';
      else if (q.documentMessage)
        preview = q.documentMessage.fileName || '[arquivo]';
    }

    return {
      quotedWaMessageId: context.stanzaId,
      quotedPreview: preview ? preview.slice(0, 120) : null,
    };
  }
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
