import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientRepository } from '../repositories/client.repository';
import { Client } from '../entities/client.entity';
import { CreateClientDto } from '@application/dtos/client/create-client.dto';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { TenantContextService } from './tenant-context.service';
import { mockTenantContextService } from '../../test/tenant-context.mock';

describe('ClientService', () => {
  let service: ClientService;
  let repository: jest.Mocked<ClientRepository>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByPhoneNormalized: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
  };

  const baseClient: Client = {
    id: 'client-1',
    tenantId: TENANT_ID_MOCK,
    name: 'Maria Silva',
    phone: '(11) 99999-9999',
    phoneNormalized: '11999999999',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: ClientRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = await module.resolve<ClientService>(ClientService);
    repository = module.get(ClientRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createClient', () => {
    const createDto: CreateClientDto = {
      name: 'Maria Silva',
      phone: '11999999999',
    };

    it('should create a client with valid data', async () => {
      mockRepository.findByPhoneNormalized.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(baseClient);

      const result = await service.createClient(createDto);

      expect(result).toEqual(baseClient);
      expect(mockRepository.save).toHaveBeenCalledWith({
        tenantId: TENANT_ID_MOCK,
        name: 'Maria Silva',
        phone: '(11) 99999-9999',
        phoneNormalized: '11999999999',
      });
    });

    it('should reject invalid phone', async () => {
      await expect(
        service.createClient({ ...createDto, phone: '123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate phone', async () => {
      mockRepository.findByPhoneNormalized.mockResolvedValue(baseClient);

      await expect(service.createClient(createDto)).rejects.toThrow(
        'Já existe um cliente com este telefone',
      );
    });
  });

  describe('resolveClientForAppointment', () => {
    it('should create a new client when phone is not registered', async () => {
      mockRepository.findByPhoneNormalized.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(baseClient);

      const result = await service.resolveClientForAppointment(
        'Maria Silva',
        '11999999999',
      );

      expect(result).toEqual({
        clientId: 'client-1',
        clientName: 'Maria Silva',
        clientPhone: '(11) 99999-9999',
      });
    });

    it('should reuse existing client by phone', async () => {
      mockRepository.findByPhoneNormalized.mockResolvedValue(baseClient);

      const result = await service.resolveClientForAppointment(
        'Maria Silva',
        '11999999999',
      );

      expect(result.clientId).toBe('client-1');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw when selected client is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.resolveClientForAppointment(
          'Maria Silva',
          '11999999999',
          'missing-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
