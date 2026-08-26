import { Test, TestingModule } from '@nestjs/testing';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { Collaborator } from '../entities/collaborator.entity';
import { CreateCollaboratorDto } from '@application/dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '@application/dtos/collaborator/update-collaborator.dto';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { TenantContextService } from './tenant-context.service';
import { mockTenantContextService } from '../../test/tenant-context.mock';

describe('CollaboratorService', () => {
  let service: CollaboratorService;
  let repository: jest.Mocked<CollaboratorRepository>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    searchByName: jest.fn(),
  };

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
      ],
    }).compile();

    service = await module.resolve<CollaboratorService>(CollaboratorService);
    repository = module.get(CollaboratorRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCollaborator', () => {
    const createDto: CreateCollaboratorDto = {
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
    };

    const expectedCollaborator: Collaborator = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: TENANT_ID_MOCK,
      name: createDto.name,
      phone: createDto.phone,
      area: createDto.area,
      isActive: true,
      services: [],
    };

    it('should create a collaborator with valid data', async () => {
      repository.save.mockResolvedValue(expectedCollaborator);

      const result = await service.createCollaborator(createDto);

      expect(result).toEqual(expectedCollaborator);
      expect(repository.save).toHaveBeenCalledWith({
        name: createDto.name,
        phone: createDto.phone,
        area: createDto.area,
        tenantId: TENANT_ID_MOCK,
        isActive: true,
      });
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
      },
      {
        id: '2',
        tenantId: TENANT_ID_MOCK,
        name: 'Maria Santos',
        phone: '11888888888',
        area: 'Manicure',
        isActive: true,
        services: [],
      },
    ];

    it('should return all collaborators', async () => {
      repository.find.mockResolvedValue(mockCollaborators);

      const result = await service.findAll();

      expect(result).toEqual(mockCollaborators);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID_MOCK },
        relations: ['services'],
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
