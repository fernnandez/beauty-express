import { Test, TestingModule } from '@nestjs/testing';
import { CollaboratorController } from './collaborator.controller';
import { CollaboratorService } from '@domain/services/collaborator.service';
import { CollaboratorRepository } from '@domain/repositories/collaborator.repository';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { CreateCollaboratorDto } from '../dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '../dtos/collaborator/update-collaborator.dto';

describe('CollaboratorController', () => {
  let controller: CollaboratorController;
  let service: CollaboratorService;

  const mockCollaborator: Collaborator = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'João Silva',
    phone: '11999999999',
    area: 'Cabeleireiro',
    commissionPercentage: 10,
    isActive: true,
    services: [],
  };

  const mockCollaboratorService = {
    createCollaborator: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateCollaborator: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollaboratorController],
      providers: [
        {
          provide: CollaboratorService,
          useValue: mockCollaboratorService,
        },
      ],
    }).compile();

    controller = module.get<CollaboratorController>(CollaboratorController);
    service = module.get<CollaboratorService>(CollaboratorService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateCollaboratorDto = {
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
    };

    it('should create a collaborator', async () => {
      mockCollaboratorService.createCollaborator.mockResolvedValue(mockCollaborator);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCollaborator);
      expect(service.createCollaborator).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    const mockCollaborators: Collaborator[] = [mockCollaborator];

    it('should return all collaborators', async () => {
      mockCollaboratorService.findAll.mockResolvedValue(mockCollaborators);

      const result = await controller.findAll();

      expect(result).toEqual(mockCollaborators);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should search collaborators when search query is provided', async () => {
      const searchTerm = 'João';
      mockCollaboratorService.findAll.mockResolvedValue([mockCollaborator]);

      const result = await controller.findAll(searchTerm);

      expect(result).toEqual([mockCollaborator]);
      expect(service.findAll).toHaveBeenCalledWith(searchTerm);
    });
  });

  describe('findOne', () => {
    it('should return a collaborator by id', async () => {
      mockCollaboratorService.findById.mockResolvedValue(mockCollaborator);

      const result = await controller.findOne(mockCollaborator.id);

      expect(result).toEqual(mockCollaborator);
      expect(service.findById).toHaveBeenCalledWith(mockCollaborator.id);
    });

    it('should return null when collaborator not found', async () => {
      mockCollaboratorService.findById.mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto: UpdateCollaboratorDto = {
      name: 'João Silva Santos',
      phone: '11988888888',
    };

    const updatedCollaborator: Collaborator = {
      ...mockCollaborator,
      ...updateDto,
    };

    it('should update a collaborator', async () => {
      mockCollaboratorService.updateCollaborator.mockResolvedValue(updatedCollaborator);

      const result = await controller.update(mockCollaborator.id, updateDto);

      expect(result).toEqual(updatedCollaborator);
      expect(service.updateCollaborator).toHaveBeenCalledWith(
        mockCollaborator.id,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a collaborator', async () => {
      mockCollaboratorService.delete.mockResolvedValue(undefined);

      await controller.remove(mockCollaborator.id);

      expect(service.delete).toHaveBeenCalledWith(mockCollaborator.id);
    });
  });
});

