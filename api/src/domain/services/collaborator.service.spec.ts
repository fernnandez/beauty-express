import { Test, TestingModule } from '@nestjs/testing';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { Collaborator } from '../entities/collaborator.entity';
import { CreateCollaboratorDto } from '@application/dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '@application/dtos/collaborator/update-collaborator.dto';

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
          provide: CollaboratorRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CollaboratorService>(CollaboratorService);
    repository = module.get(CollaboratorRepository);

    // Reset mocks
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
      commissionPercentage: 10,
    };

    const expectedCollaborator: Collaborator = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      ...createDto,
      isActive: true,
      services: [],
    };

    it('should create a collaborator with valid data', async () => {
      repository.save.mockResolvedValue(expectedCollaborator);

      const result = await service.createCollaborator(createDto);

      expect(result).toEqual(expectedCollaborator);
      expect(repository.save).toHaveBeenCalledWith({
        ...createDto,
        isActive: true,
      });
    });

    it('should throw error when commission percentage is negative', async () => {
      const invalidDto = { ...createDto, commissionPercentage: -1 };

      await expect(service.createCollaborator(invalidDto)).rejects.toThrow(
        'Commission percentage must be between 0 and 100',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw error when commission percentage is greater than 100', async () => {
      const invalidDto = { ...createDto, commissionPercentage: 101 };

      await expect(service.createCollaborator(invalidDto)).rejects.toThrow(
        'Commission percentage must be between 0 and 100',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should accept commission percentage of 0', async () => {
      const dtoWithZero = { ...createDto, commissionPercentage: 0 };
      repository.save.mockResolvedValue({
        ...expectedCollaborator,
        commissionPercentage: 0,
      });

      await service.createCollaborator(dtoWithZero);

      expect(repository.save).toHaveBeenCalled();
    });

    it('should accept commission percentage of 100', async () => {
      const dtoWithHundred = { ...createDto, commissionPercentage: 100 };
      repository.save.mockResolvedValue({
        ...expectedCollaborator,
        commissionPercentage: 100,
      });

      await service.createCollaborator(dtoWithHundred);

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockCollaborators: Collaborator[] = [
      {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        area: 'Cabeleireiro',
        commissionPercentage: 10,
        isActive: true,
        services: [],
      },
      {
        id: '2',
        name: 'Maria Santos',
        phone: '11888888888',
        area: 'Manicure',
        commissionPercentage: 15,
        isActive: true,
        services: [],
      },
    ];

    it('should return all collaborators', async () => {
      repository.find.mockResolvedValue(mockCollaborators);

      const result = await service.findAll();

      expect(result).toEqual(mockCollaborators);
      expect(repository.find).toHaveBeenCalledWith({ relations: ['services'] });
    });

    it('should search collaborators by name when search term is provided', async () => {
      const searchTerm = 'João';
      repository.searchByName.mockResolvedValue([mockCollaborators[0]]);

      const result = await service.findAll(searchTerm);

      expect(result).toEqual([mockCollaborators[0]]);
      expect(repository.searchByName).toHaveBeenCalledWith(searchTerm.trim());
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
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
      isActive: true,
      services: [],
    };

    it('should return collaborator when found', async () => {
      repository.findById.mockResolvedValue(mockCollaborator);

      const result = await service.findById(mockCollaborator.id);

      expect(result).toEqual(mockCollaborator);
      expect(repository.findById).toHaveBeenCalledWith(mockCollaborator.id);
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
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
      isActive: true,
      services: [],
    };

    const updatedCollaborator: Collaborator = {
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
        existingCollaborator.id,
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
          commissionPercentage: -1,
        }),
      ).rejects.toThrow('Commission percentage must be between 0 and 100');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw error when commission percentage is greater than 100', async () => {
      repository.findById.mockResolvedValue(existingCollaborator);

      await expect(
        service.updateCollaborator(existingCollaborator.id, {
          commissionPercentage: 101,
        }),
      ).rejects.toThrow('Commission percentage must be between 0 and 100');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should update isActive status', async () => {
      const updateDto: UpdateCollaboratorDto = { isActive: false };
      const deactivatedCollaborator: Collaborator = {
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
        existingCollaborator.id,
        updateDto,
      );
    });

    it('should accept valid commission percentage update', async () => {
      const updateDto: UpdateCollaboratorDto = { commissionPercentage: 20 };
      const updatedCollaborator: Collaborator = {
        ...existingCollaborator,
        commissionPercentage: 20,
      };

      repository.findById.mockResolvedValueOnce(existingCollaborator);
      repository.findById.mockResolvedValueOnce(updatedCollaborator);
      repository.update.mockResolvedValue(undefined);

      await service.updateCollaborator(existingCollaborator.id, updateDto);

      expect(repository.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const existingCollaborator: Collaborator = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
      isActive: true,
      services: [],
    };

    it('should delete collaborator when found', async () => {
      repository.findById.mockResolvedValue(existingCollaborator);
      repository.delete.mockResolvedValue(undefined);

      await service.delete(existingCollaborator.id);

      expect(repository.findById).toHaveBeenCalledWith(existingCollaborator.id);
      expect(repository.delete).toHaveBeenCalledWith(existingCollaborator.id);
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
