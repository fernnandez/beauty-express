import { Test, TestingModule } from '@nestjs/testing';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CollaboratorCommissionRateRepository } from '../repositories/collaborator-commission-rate.repository';
import { Collaborator } from '../entities/collaborator.entity';
import { CreateCollaboratorDto } from '@application/dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '@application/dtos/collaborator/update-collaborator.dto';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { TenantContextService } from './tenant-context.service';
import { mockTenantContextService } from '../../test/tenant-context.mock';

describe('CollaboratorService', () => {
  let service: CollaboratorService;
  let repository: jest.Mocked<CollaboratorRepository>;
  let commissionRateRepository: jest.Mocked<CollaboratorCommissionRateRepository>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    searchByName: jest.fn(),
  };

  const mockCommissionRateRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByCollaboratorId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMissingForCollaborator: jest.fn(),
  };

  const defaultRates = [
    {
      id: 'rate-1',
      tenantId: TENANT_ID_MOCK,
      collaboratorId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Cabeleireiro',
      percentage: 10,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaboratorService,
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: CollaboratorRepository,
          useValue: mockRepository,
        },
        {
          provide: CollaboratorCommissionRateRepository,
          useValue: mockCommissionRateRepository,
        },
      ],
    }).compile();

    service = await module.resolve<CollaboratorService>(CollaboratorService);
    repository = module.get(CollaboratorRepository);
    commissionRateRepository = module.get(CollaboratorCommissionRateRepository);

    jest.clearAllMocks();
    mockCommissionRateRepository.deleteMissingForCollaborator.mockResolvedValue(
      undefined,
    );
    mockCommissionRateRepository.save.mockResolvedValue(defaultRates[0]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCollaborator', () => {
    const createDto: CreateCollaboratorDto = {
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionRates: [{ name: 'Cabeleireiro', percentage: 10 }],
    };

    const expectedCollaborator: Collaborator = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: TENANT_ID_MOCK,
      name: createDto.name,
      phone: createDto.phone,
      area: createDto.area,
      isActive: true,
      services: [],
      commissionRates: defaultRates,
    };

    it('should create a collaborator with valid data', async () => {
      repository.save.mockResolvedValue(expectedCollaborator);
      repository.findById.mockResolvedValue(expectedCollaborator);

      const result = await service.createCollaborator(createDto);

      expect(result).toEqual(expectedCollaborator);
      expect(repository.save).toHaveBeenCalledWith({
        name: createDto.name,
        phone: createDto.phone,
        area: createDto.area,
        tenantId: TENANT_ID_MOCK,
        isActive: true,
      });
      expect(commissionRateRepository.save).toHaveBeenCalledWith({
        tenantId: TENANT_ID_MOCK,
        collaboratorId: expectedCollaborator.id,
        name: 'Cabeleireiro',
        percentage: 10,
      });
    });

    it('should throw error when commission percentage is negative', async () => {
      const invalidDto = {
        ...createDto,
        commissionRates: [{ name: 'Cabeleireiro', percentage: -1 }],
      };

      await expect(service.createCollaborator(invalidDto)).rejects.toThrow(
        'Commission percentage must be between 0 and 100',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw error when commission percentage is greater than 100', async () => {
      const invalidDto = {
        ...createDto,
        commissionRates: [{ name: 'Cabeleireiro', percentage: 101 }],
      };

      await expect(service.createCollaborator(invalidDto)).rejects.toThrow(
        'Commission percentage must be between 0 and 100',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should accept commission percentage of 0', async () => {
      const dtoWithZero = {
        ...createDto,
        commissionRates: [{ name: 'Cabeleireiro', percentage: 0 }],
      };
      repository.save.mockResolvedValue(expectedCollaborator);
      repository.findById.mockResolvedValue(expectedCollaborator);

      await service.createCollaborator(dtoWithZero);

      expect(repository.save).toHaveBeenCalled();
    });

    it('should accept commission percentage of 100', async () => {
      const dtoWithHundred = {
        ...createDto,
        commissionRates: [{ name: 'Cabeleireiro', percentage: 100 }],
      };
      repository.save.mockResolvedValue(expectedCollaborator);
      repository.findById.mockResolvedValue(expectedCollaborator);

      await service.createCollaborator(dtoWithHundred);

      expect(repository.save).toHaveBeenCalled();
    });

    it('should create a collaborator with multiple commission rates', async () => {
      const dtoWithMultipleRates: CreateCollaboratorDto = {
        ...createDto,
        commissionRates: [
          { name: 'Nail Designer', percentage: 40 },
          { name: 'Cabelo', percentage: 50 },
        ],
      };
      repository.save.mockResolvedValue(expectedCollaborator);
      repository.findById.mockResolvedValue(expectedCollaborator);

      await service.createCollaborator(dtoWithMultipleRates);

      expect(commissionRateRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    const mockCollaborators: Collaborator[] = [
      {
        id: '1',
        tenantId: TENANT_ID_MOCK,
        name: 'João Silva',
        phone: '11999999999',
        area: 'Cabeleireiro',
        isActive: true,
        services: [],
        commissionRates: defaultRates,
      },
      {
        id: '2',
        tenantId: TENANT_ID_MOCK,
        name: 'Maria Santos',
        phone: '11888888888',
        area: 'Manicure',
        isActive: true,
        services: [],
        commissionRates: [
          {
            id: 'rate-2',
            tenantId: TENANT_ID_MOCK,
            collaboratorId: '2',
            name: 'Manicure',
            percentage: 15,
          },
        ],
      },
    ];

    it('should return all collaborators', async () => {
      repository.find.mockResolvedValue(mockCollaborators);

      const result = await service.findAll();

      expect(result).toEqual(mockCollaborators);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID_MOCK },
        relations: ['services', 'commissionRates'],
      });
    });

    it('should search collaborators by name when search term is provided', async () => {
      const searchTerm = 'João';
      repository.searchByName.mockResolvedValue([mockCollaborators[0]]);

      const result = await service.findAll(searchTerm);

      expect(result).toEqual([mockCollaborators[0]]);
      expect(repository.searchByName).toHaveBeenCalledWith(
        searchTerm.trim(),
        TENANT_ID_MOCK,
      );
      expect(repository.find).not.toHaveBeenCalled();
    });

    it('should not search when search term is empty string', async () => {
      repository.find.mockResolvedValue(mockCollaborators);

      await service.findAll('');

      expect(repository.find).toHaveBeenCalled();
      expect(repository.searchByName).not.toHaveBeenCalled();
    });

    it('should not search when search term is only whitespace', async () => {
      repository.find.mockResolvedValue(mockCollaborators);

      await service.findAll('   ');

      expect(repository.find).toHaveBeenCalled();
      expect(repository.searchByName).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    const mockCollaborator: Collaborator = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: TENANT_ID_MOCK,
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      isActive: true,
      services: [],
      commissionRates: defaultRates,
    };

    it('should return collaborator when found', async () => {
      repository.findById.mockResolvedValue(mockCollaborator);

      const result = await service.findById(mockCollaborator.id);

      expect(result).toEqual(mockCollaborator);
      expect(repository.findById).toHaveBeenCalledWith(
        mockCollaborator.id,
        TENANT_ID_MOCK,
      );
    });

    it('should return null when collaborator not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateCollaborator', () => {
    const existingCollaborator: Collaborator = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: TENANT_ID_MOCK,
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      isActive: true,
      services: [],
      commissionRates: defaultRates,
    };

    const updatedCollaborator: Collaborator = {
      tenantId: TENANT_ID_MOCK,
      ...existingCollaborator,
      name: 'João Silva Santos',
      phone: '11988888888',
    };

    it('should update collaborator with valid data', async () => {
      const updateDto: UpdateCollaboratorDto = {
        name: 'João Silva Santos',
        phone: '11988888888',
      };

      repository.findById.mockResolvedValueOnce(existingCollaborator);
      repository.findById.mockResolvedValueOnce(updatedCollaborator);
      repository.update.mockResolvedValue(undefined);

      const result = await service.updateCollaborator(
        existingCollaborator.id,
        updateDto,
      );

      expect(result).toEqual(updatedCollaborator);
      expect(repository.update).toHaveBeenCalledWith(
        { id: existingCollaborator.id, tenantId: TENANT_ID_MOCK },
        updateDto,
      );
    });

    it('should throw error when collaborator not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateCollaborator('non-existent-id', { name: 'New Name' }),
      ).rejects.toThrow('Collaborator not found');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw error when commission percentage is negative', async () => {
      repository.findById.mockResolvedValue(existingCollaborator);

      await expect(
        service.updateCollaborator(existingCollaborator.id, {
          commissionRates: [{ name: 'Cabeleireiro', percentage: -1 }],
        }),
      ).rejects.toThrow('Commission percentage must be between 0 and 100');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw error when commission percentage is greater than 100', async () => {
      repository.findById.mockResolvedValue(existingCollaborator);

      await expect(
        service.updateCollaborator(existingCollaborator.id, {
          commissionRates: [{ name: 'Cabeleireiro', percentage: 101 }],
        }),
      ).rejects.toThrow('Commission percentage must be between 0 and 100');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should update isActive status', async () => {
      const updateDto: UpdateCollaboratorDto = { isActive: false };
      const deactivatedCollaborator: Collaborator = {
        tenantId: TENANT_ID_MOCK,
        ...existingCollaborator,
        isActive: false,
      };

      repository.findById.mockResolvedValueOnce(existingCollaborator);
      repository.findById.mockResolvedValueOnce(deactivatedCollaborator);
      repository.update.mockResolvedValue(undefined);

      const result = await service.updateCollaborator(
        existingCollaborator.id,
        updateDto,
      );

      expect(result.isActive).toBe(false);
      expect(repository.update).toHaveBeenCalledWith(
        { id: existingCollaborator.id, tenantId: TENANT_ID_MOCK },
        updateDto,
      );
    });

    it('should accept valid commission rates update', async () => {
      const updateDto: UpdateCollaboratorDto = {
        commissionRates: [{ id: 'rate-1', name: 'Cabelo', percentage: 20 }],
      };
      const updatedWithRates: Collaborator = {
        tenantId: TENANT_ID_MOCK,
        ...existingCollaborator,
        commissionRates: [{ ...defaultRates[0], name: 'Cabelo', percentage: 20 }],
      };

      repository.findById.mockResolvedValueOnce(existingCollaborator);
      repository.findById.mockResolvedValueOnce(updatedWithRates);
      mockCommissionRateRepository.findById.mockResolvedValue(defaultRates[0]);
      mockCommissionRateRepository.update.mockResolvedValue(undefined);

      await service.updateCollaborator(existingCollaborator.id, updateDto);

      expect(commissionRateRepository.update).toHaveBeenCalledWith(
        { id: 'rate-1', tenantId: TENANT_ID_MOCK },
        { name: 'Cabelo', percentage: 20 },
      );
    });
  });

  describe('delete', () => {
    const existingCollaborator: Collaborator = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: TENANT_ID_MOCK,
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      isActive: true,
      services: [],
      commissionRates: defaultRates,
    };

    it('should delete collaborator when found', async () => {
      repository.findById.mockResolvedValue(existingCollaborator);
      repository.delete.mockResolvedValue(undefined);

      await service.delete(existingCollaborator.id);

      expect(repository.findById).toHaveBeenCalledWith(
        existingCollaborator.id,
        TENANT_ID_MOCK,
      );
      expect(repository.delete).toHaveBeenCalledWith({
        id: existingCollaborator.id,
        tenantId: TENANT_ID_MOCK,
      });
    });

    it('should throw error when collaborator not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        'Collaborator not found',
      );

      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
