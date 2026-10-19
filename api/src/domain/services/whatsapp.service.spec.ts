import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappInstanceRepository } from '../repositories/whatsapp-instance.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientRepository } from '../repositories/client.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { EvolutionClient } from './evolution.client';
import { WhatsappGateway } from './whatsapp.gateway';
import { TenantContextService } from './tenant-context.service';
import { MEDIA_STORAGE } from './media-storage/media-storage.interface';
import { WhatsappRateLimiter } from './whatsapp-rate-limiter.service';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from '../entities/whatsapp-enums';

describe('WhatsappService', () => {
  let service: WhatsappService;

  const mockInstanceRepository = {
    findByTenant: jest.fn(),
    findByInstanceName: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn((v) => Promise.resolve({ id: v.id ?? 'inst-1', ...v })),
  };
  const mockConversationRepository = {
    findById: jest.fn(),
    findByWaChatId: jest.fn(),
    listByTenant: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn((v) => Promise.resolve({ id: v.id ?? 'conv-1', ...v })),
  };
  const mockMessageRepository = {
    findByWaMessageId: jest.fn(),
    findById: jest.fn(),
    listByConversation: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn((v) => Promise.resolve({ id: 'msg-1', ...v })),
  };
  const mockClientRepository = {
    findByPhoneNormalized: jest.fn(),
    findById: jest.fn(),
  };
  const mockServiceRepository = {
    find: jest.fn(),
  };
  const mockAppointmentRepository = {
    findClientIdsWithUpcoming: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
  };
  const mockEvolution = {
    sendText: jest.fn(),
    connect: jest.fn(),
    createInstance: jest.fn(),
    setWebhook: jest.fn(),
    sendReaction: jest.fn(),
  };
  const mockGateway = {
    emitInboxUpdate: jest.fn(),
  };
  const mockMediaStorage = {
    store: jest
      .fn()
      .mockImplementation((input: { mime: string; base64: string }) =>
        Promise.resolve(`data:${input.mime};base64,${input.base64}`),
      ),
  };
  const mockRateLimiter = {
    check: jest.fn(),
  };
  const mockTenantContext = {
    requireTenantId: jest.fn().mockReturnValue(TENANT_ID_MOCK),
    getUserId: jest.fn().mockReturnValue('user-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        {
          provide: WhatsappInstanceRepository,
          useValue: mockInstanceRepository,
        },
        {
          provide: ConversationRepository,
          useValue: mockConversationRepository,
        },
        { provide: MessageRepository, useValue: mockMessageRepository },
        { provide: ClientRepository, useValue: mockClientRepository },
        { provide: ServiceRepository, useValue: mockServiceRepository },
        {
          provide: AppointmentRepository,
          useValue: mockAppointmentRepository,
        },
        { provide: EvolutionClient, useValue: mockEvolution },
        { provide: WhatsappGateway, useValue: mockGateway },
        { provide: TenantContextService, useValue: mockTenantContext },
        { provide: MEDIA_STORAGE, useValue: mockMediaStorage },
        { provide: WhatsappRateLimiter, useValue: mockRateLimiter },
      ],
    }).compile();

    service = await module.resolve<WhatsappService>(WhatsappService);
    jest.clearAllMocks();
    mockTenantContext.requireTenantId.mockReturnValue(TENANT_ID_MOCK);
    mockTenantContext.getUserId.mockReturnValue('user-1');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('rejeita mensagem vazia', async () => {
      await expect(service.sendMessage('conv-1', '  ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita conversa inexistente', async () => {
      mockConversationRepository.findById.mockResolvedValue(null);
      await expect(service.sendMessage('conv-x', 'oi')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejeita quando não há instância conectada', async () => {
      mockConversationRepository.findById.mockResolvedValue({
        id: 'conv-1',
        tenantId: TENANT_ID_MOCK,
        phoneNormalized: '5581999999999',
      });
      mockInstanceRepository.findByTenant.mockResolvedValue(null);
      await expect(service.sendMessage('conv-1', 'oi')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('envia e grava mensagem outbound com status sent', async () => {
      mockConversationRepository.findById.mockResolvedValue({
        id: 'conv-1',
        tenantId: TENANT_ID_MOCK,
        phoneNormalized: '5581999999999',
      });
      mockInstanceRepository.findByTenant.mockResolvedValue({
        instanceName: 'salao-1',
      });
      mockEvolution.sendText.mockResolvedValue({ key: { id: 'WA123' } });

      const result = await service.sendMessage('conv-1', '  Olá!  ');

      expect(mockEvolution.sendText).toHaveBeenCalledWith(
        'salao-1',
        '5581999999999',
        'Olá!',
      );
      expect(mockMessageRepository.save).toHaveBeenCalled();
      const saved = mockMessageRepository.create.mock.calls[0][0];
      expect(saved.direction).toBe(MessageDirection.OUTBOUND);
      expect(saved.status).toBe(MessageStatus.SENT);
      expect(saved.waMessageId).toBe('WA123');
      expect(saved.sentByUserId).toBe('user-1');
      expect(result.content).toBe('Olá!');
    });

    it('grava como failed e lança erro quando a Evolution falha', async () => {
      mockConversationRepository.findById.mockResolvedValue({
        id: 'conv-1',
        tenantId: TENANT_ID_MOCK,
        phoneNormalized: '5581999999999',
      });
      mockInstanceRepository.findByTenant.mockResolvedValue({
        instanceName: 'salao-1',
      });
      mockEvolution.sendText.mockRejectedValue(new Error('boom'));

      await expect(service.sendMessage('conv-1', 'oi')).rejects.toThrow(
        BadRequestException,
      );
      const saved = mockMessageRepository.create.mock.calls[0][0];
      expect(saved.status).toBe(MessageStatus.FAILED);
    });
  });

  describe('reactToMessage', () => {
    it('envia a reação e grava o emoji na mensagem', async () => {
      mockMessageRepository.findById.mockResolvedValue({
        id: 'm1',
        conversationId: 'conv-1',
        waMessageId: 'WA-1',
        direction: 'inbound',
      });
      mockConversationRepository.findById.mockResolvedValue({
        id: 'conv-1',
        tenantId: TENANT_ID_MOCK,
        waChatId: '5581988887777@s.whatsapp.net',
      });
      mockInstanceRepository.findByTenant.mockResolvedValue({
        instanceName: 'salao-1',
      });
      mockEvolution.sendReaction.mockResolvedValue({});

      await service.reactToMessage('m1', '👍');

      expect(mockEvolution.sendReaction).toHaveBeenCalledWith(
        'salao-1',
        '5581988887777@s.whatsapp.net',
        false,
        'WA-1',
        '👍',
      );
      const saved = mockMessageRepository.save.mock.calls.at(-1)[0];
      expect(saved.reaction).toBe('👍');
    });

    it('rejeita mensagem inexistente', async () => {
      mockMessageRepository.findById.mockResolvedValue(null);
      await expect(service.reactToMessage('x', '👍')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('buildPriceListText', () => {
    it('rejeita quando não há serviços', async () => {
      mockServiceRepository.find.mockResolvedValue([]);
      await expect(service.buildPriceListText()).rejects.toThrow(
        BadRequestException,
      );
    });
    it('monta a tabela de preços como texto', async () => {
      mockServiceRepository.find.mockResolvedValue([
        { name: 'Corte', defaultPrice: 50 },
        { name: 'Escova', defaultPrice: 40 },
      ]);

      const text = await service.buildPriceListText();

      expect(text).toContain('Tabela de serviços e preços');
      expect(text).toContain('Corte');
      expect(text).toContain('R$');
    });
  });

  describe('processInboundWebhook', () => {
    const basePayload = {
      instance: 'salao-1',
      event: 'messages.upsert',
      data: {
        key: {
          remoteJid: '5581988887777@s.whatsapp.net',
          fromMe: false,
          id: 'WA-IN-1',
        },
        pushName: 'Fulano',
        messageTimestamp: 1700000000,
        message: { conversation: 'Oi, tudo bem?' },
      },
    };

    it('ignora quando a instância é desconhecida', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue(null);
      const result = await service.processInboundWebhook(basePayload);
      expect(result).toBeNull();
    });

    it('ignora mensagens de grupo', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue({
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
      });
      const result = await service.processInboundWebhook({
        ...basePayload,
        data: {
          ...basePayload.data,
          key: { ...basePayload.data.key, remoteJid: '123456@g.us' },
        },
      });
      expect(result).toBeNull();
      expect(mockMessageRepository.save).not.toHaveBeenCalled();
    });

    it('ignora eco (fromMe)', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue({
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
      });
      const result = await service.processInboundWebhook({
        ...basePayload,
        data: {
          ...basePayload.data,
          key: { ...basePayload.data.key, fromMe: true },
        },
      });
      expect(result).toBeNull();
    });

    it('faz dedupe por waMessageId', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue({
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
      });
      mockMessageRepository.findByWaMessageId.mockResolvedValue({
        id: 'existing',
      });
      const result = await service.processInboundWebhook(basePayload);
      expect(result).toBeNull();
      expect(mockMessageRepository.save).not.toHaveBeenCalled();
    });

    it('cria conversa casando com cliente e grava inbound', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue({
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
      });
      mockMessageRepository.findByWaMessageId.mockResolvedValue(null);
      mockConversationRepository.findByWaChatId.mockResolvedValue(null);
      mockClientRepository.findByPhoneNormalized.mockResolvedValue({
        id: 'client-9',
        name: 'Maria Cliente',
      });

      const result = await service.processInboundWebhook(basePayload);

      // casou cliente pelo telefone normalizado
      expect(mockClientRepository.findByPhoneNormalized).toHaveBeenCalledWith(
        '5581988887777',
        TENANT_ID_MOCK,
      );
      const conv = mockConversationRepository.create.mock.calls[0][0];
      expect(conv.clientId).toBe('client-9');
      expect(conv.contactName).toBe('Maria Cliente');

      const msg = mockMessageRepository.create.mock.calls[0][0];
      expect(msg.direction).toBe(MessageDirection.INBOUND);
      expect(msg.type).toBe(MessageType.TEXT);
      expect(msg.content).toBe('Oi, tudo bem?');
      expect(result).not.toBeNull();
    });

    it('reaproveita conversa existente e incrementa não lidas', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue({
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
      });
      mockMessageRepository.findByWaMessageId.mockResolvedValue(null);
      mockConversationRepository.findByWaChatId.mockResolvedValue({
        id: 'conv-7',
        tenantId: TENANT_ID_MOCK,
        unreadCount: 2,
        contactName: 'Fulano',
      });

      await service.processInboundWebhook(basePayload);

      expect(mockClientRepository.findByPhoneNormalized).not.toHaveBeenCalled();
      const savedConv = mockConversationRepository.save.mock.calls[0][0];
      expect(savedConv.unreadCount).toBe(3);
      expect(savedConv.id).toBe('conv-7');
    });

    it('messages.update avança o status da mensagem outbound', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue({
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
      });
      mockMessageRepository.findByWaMessageId.mockResolvedValue({
        id: 'm1',
        direction: 'outbound',
        status: 'sent',
      });
      mockMessageRepository.save.mockClear();

      const result = await service.processInboundWebhook({
        instance: 'salao-1',
        event: 'messages.update',
        data: { keyId: 'WA-OUT-1', status: 'READ' },
      });

      expect(result).toBeNull();
      const saved = mockMessageRepository.save.mock.calls.at(-1)[0];
      expect(saved.status).toBe('read');
    });

    it('messages.update não rebaixa o status', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue({
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
      });
      mockMessageRepository.findByWaMessageId.mockResolvedValue({
        id: 'm1',
        direction: 'outbound',
        status: 'read',
      });
      mockMessageRepository.save.mockClear();

      await service.processInboundWebhook({
        instance: 'salao-1',
        event: 'messages.update',
        data: { keyId: 'WA-OUT-1', status: 'DELIVERY_ACK' },
      });

      expect(mockMessageRepository.save).not.toHaveBeenCalled();
    });

    it('reactionMessage anexa emoji à mensagem-alvo e não cria mensagem', async () => {
      mockInstanceRepository.findByInstanceName.mockResolvedValue({
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
      });
      mockMessageRepository.findByWaMessageId.mockResolvedValue({
        id: 'target-1',
        reaction: null,
      });
      mockMessageRepository.create.mockClear();
      mockMessageRepository.save.mockClear();

      const result = await service.processInboundWebhook({
        instance: 'salao-1',
        event: 'messages.upsert',
        data: {
          key: {
            remoteJid: '5581988887777@s.whatsapp.net',
            fromMe: true,
            id: 'evt-1',
          },
          message: {
            reactionMessage: { key: { id: 'WA-TARGET' }, text: '👍' },
          },
        },
      });

      expect(result).toBeNull();
      expect(mockMessageRepository.create).not.toHaveBeenCalled();
      const saved = mockMessageRepository.save.mock.calls.at(-1)[0];
      expect(saved.reaction).toBe('👍');
    });

    it('connection.update open marca a instância como conectada', async () => {
      const instance = {
        tenantId: TENANT_ID_MOCK,
        instanceName: 'salao-1',
        status: 'connecting',
      };
      mockInstanceRepository.findByInstanceName.mockResolvedValue(instance);

      const result = await service.processInboundWebhook({
        instance: 'salao-1',
        event: 'connection.update',
        data: { state: 'open' },
      });

      expect(result).toBeNull();
      const saved = mockInstanceRepository.save.mock.calls[0][0];
      expect(saved.status).toBe('connected');
    });
  });

  describe('pareamento', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
      process.env = {
        ...OLD_ENV,
        EVOLUTION_WEBHOOK_PUBLIC_URL: 'https://api.example.com',
        EVOLUTION_WEBHOOK_TOKEN: 'secret',
      };
    });
    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('getInstanceStatus cria a instância local se não existir', async () => {
      mockInstanceRepository.findByTenant.mockResolvedValue(null);
      const result = await service.getInstanceStatus();
      expect(mockInstanceRepository.create).toHaveBeenCalled();
      expect(result.status).toBe('disconnected');
    });

    it('createInstance chama a Evolution com a webhookUrl montada', async () => {
      mockInstanceRepository.findByTenant.mockResolvedValue({
        id: 'inst-1',
        tenantId: TENANT_ID_MOCK,
        instanceName: `beauty-${TENANT_ID_MOCK}`,
        status: 'disconnected',
      });
      mockEvolution.createInstance.mockResolvedValue({});

      const result = await service.createInstance();

      expect(mockEvolution.createInstance).toHaveBeenCalledWith(
        `beauty-${TENANT_ID_MOCK}`,
        'https://api.example.com/webhooks/whatsapp?token=secret',
      );
      expect(result.status).toBe('connecting');
    });

    it('getConnectionQr retorna base64 e code', async () => {
      mockInstanceRepository.findByTenant.mockResolvedValue({
        id: 'inst-1',
        tenantId: TENANT_ID_MOCK,
        instanceName: `beauty-${TENANT_ID_MOCK}`,
        status: 'connecting',
      });
      mockEvolution.connect.mockResolvedValue({
        base64: 'data:image/png;base64,abc',
        pairingCode: '12345678',
      });

      const result = await service.getConnectionQr();
      expect(result.base64).toContain('base64');
      expect(result.code).toBe('12345678');
    });
  });

  describe('iniciar/vincular conversa', () => {
    it('startConversationWithClient cria conversa vinculada pelo telefone', async () => {
      mockClientRepository.findById.mockResolvedValue({
        id: 'client-1',
        name: 'Maria',
        phoneNormalized: '5581988887777',
      });
      mockConversationRepository.findByWaChatId.mockResolvedValue(null);

      await service.startConversationWithClient('client-1');

      const created = mockConversationRepository.create.mock.calls[0][0];
      expect(created.waChatId).toBe('5581988887777@s.whatsapp.net');
      expect(created.clientId).toBe('client-1');
      expect(created.contactName).toBe('Maria');
    });

    it('linkConversationToClient vincula a conversa ao cliente', async () => {
      mockConversationRepository.findById.mockResolvedValue({
        id: 'conv-1',
        tenantId: TENANT_ID_MOCK,
        clientId: null,
      });
      mockClientRepository.findById.mockResolvedValue({
        id: 'client-7',
        name: 'João',
      });

      await service.linkConversationToClient('conv-1', 'client-7');

      const saved = mockConversationRepository.save.mock.calls[0][0];
      expect(saved.clientId).toBe('client-7');
      expect(saved.contactName).toBe('João');
    });

    describe('confirmação de agendamento', () => {
      it('prepara o texto e abre a conversa pelo telefone do agendamento', async () => {
        mockAppointmentRepository.findById.mockResolvedValue({
          id: 'ap-1',
          tenantId: TENANT_ID_MOCK,
          clientName: 'Carla Mendes',
          clientPhone: '(11) 99999-1111',
          clientId: null,
          date: new Date('2026-10-20T12:00:00Z'),
          startTime: '14:00',
          scheduledServices: [{ service: { name: 'Manicure' } }],
        });
        mockConversationRepository.findByWaChatId.mockResolvedValue(null);
        mockClientRepository.findByPhoneNormalized.mockResolvedValue(null);

        const result = await service.prepareAppointmentConfirmation('ap-1');

        // Não deve enviar nada — apenas preparar.
        expect(mockEvolution.sendText).not.toHaveBeenCalled();
        expect(result.text).toContain('Carla');
        expect(result.text).toContain('14:00');
        expect(result.text).toContain('Manicure');
        expect(result.conversation).toBeTruthy();
      });

      it('rejeita agendamento sem telefone', async () => {
        mockAppointmentRepository.findById.mockResolvedValue({
          id: 'ap-2',
          tenantId: TENANT_ID_MOCK,
          clientName: 'Sem Fone',
          clientPhone: '',
          date: new Date(),
          startTime: '10:00',
        });
        await expect(
          service.prepareAppointmentConfirmation('ap-2'),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('listConversations categorias', () => {
    it('classifica lead, scheduled e client', async () => {
      mockConversationRepository.listByTenant.mockResolvedValue([
        { id: 'c1', clientId: null }, // lead
        { id: 'c2', clientId: 'client-A' }, // scheduled (tem futuro)
        { id: 'c3', clientId: 'client-B' }, // client (sem futuro)
      ]);
      mockAppointmentRepository.findClientIdsWithUpcoming.mockResolvedValue([
        'client-A',
      ]);

      const result = await service.listConversations();

      expect(result.find((c) => c.id === 'c1')?.category).toBe('lead');
      expect(result.find((c) => c.id === 'c2')?.category).toBe('scheduled');
      expect(result.find((c) => c.id === 'c3')?.category).toBe('client');
    });
  });
});
