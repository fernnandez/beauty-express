import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from './client.controller';
import { ClientService } from '@domain/services/client.service';
import { Client } from '@domain/entities/client.entity';
import { CreateClientDto } from '../dtos/client/create-client.dto';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';

describe('ClientController', () => {
  let controller: ClientController;

  const mockClient: Client = {
    id: 'client-1',
    tenantId: TENANT_ID_MOCK,
    name: 'Maria Silva',
    phone: '(11) 99999-9999',
    phoneNormalized: '11999999999',
  };

  const mockClientService = {
    createClient: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateClient: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a client', async () => {
    const createDto: CreateClientDto = {
      name: 'Maria Silva',
      phone: '11999999999',
    };
    mockClientService.createClient.mockResolvedValue(mockClient);

    const result = await controller.create(createDto);

    expect(result).toEqual(mockClient);
    expect(mockClientService.createClient).toHaveBeenCalledWith(createDto);
  });

  it('should list clients', async () => {
    mockClientService.findAll.mockResolvedValue([mockClient]);

    const result = await controller.findAll('maria');

    expect(result).toEqual([mockClient]);
    expect(mockClientService.findAll).toHaveBeenCalledWith('maria');
  });
});
