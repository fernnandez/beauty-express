import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappInstanceRepository } from '../repositories/whatsapp-instance.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientRepository } from '../repositories/client.repository';
import { EvolutionClient } from './evolution.client';
import { TenantContextService } from './tenant-context.service';
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
    listByConversation: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn((v) => Promise.resolve({ id: 'msg-1', ...v })),
  };
  const mockClientRepository = {
    findByPhoneNormalized: jest.fn(),
  };
  const mockEvolution = {
    sendText: jest.fn(),
    connect: jest.fn(),
    createInstance: jest.fn(),
    setWebhook: jest.fn(),
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
        { provide: EvolutionClient, useValue: mockEvolution },
        { provide: TenantContextService, useValue: mockTenantContext },
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
});
