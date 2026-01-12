import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from './service.service';
import { ServiceRepository } from '../repositories/service.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '@application/dtos/service/create-service.dto';
import { UpdateServiceDto } from '@application/dtos/service/update-service.dto';

describe('ServiceService', () => {
  let service: ServiceService;
  let repository: jest.Mocked<ServiceRepository>;
  let scheduledServiceRepository: jest.Mocked<ScheduledServiceRepository>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    searchByName: jest.fn(),
  };

  const mockScheduledServiceRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: ServiceRepository,
          useValue: mockRepository,
        },
        {
          provide: ScheduledServiceRepository,
          useValue: mockScheduledServiceRepository,
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
    repository = module.get(ServiceRepository);
    scheduledServiceRepository = module.get(ScheduledServiceRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createService', () => {
    const createDto: CreateServiceDto = {
      name: 'Corte de Cabelo',
      defaultPrice: 50.0,
      description: 'Corte profissional',
    };

    const expectedService: Service = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      ...createDto,
      collaborators: [],
    };

    it('should create a service with valid data', async () => {
      repository.save.mockResolvedValue(expectedService);

      const result = await service.createService(createDto);

      expect(result).toEqual(expectedService);
      expect(repository.save).toHaveBeenCalledWith(createDto);
    });

    it('should throw error when price is zero', async () => {
      const invalidDto = { ...createDto, defaultPrice: 0 };

      await expect(service.createService(invalidDto)).rejects.toThrow(
        'Price must be greater than zero',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw error when price is negative', async () => {
      const invalidDto = { ...createDto, defaultPrice: -10 };

      await expect(service.createService(invalidDto)).rejects.toThrow(
        'Price must be greater than zero',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should accept service without description', async () => {
      const dtoWithoutDescription = {
        name: 'Corte de Cabelo',
        defaultPrice: 50.0,
      };
      repository.save.mockResolvedValue({
        ...expectedService,
        description: undefined,
      });

      await service.createService(dtoWithoutDescription);

      expect(repository.save).toHaveBeenCalled();
    });

    it('should accept very small positive price', async () => {
      const dtoWithSmallPrice = { ...createDto, defaultPrice: 0.01 };
      repository.save.mockResolvedValue({
        ...expectedService,
        defaultPrice: 0.01,
      });

      await service.createService(dtoWithSmallPrice);

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockServices: Service[] = [
      {
        id: '1',
        name: 'Corte de Cabelo',
        defaultPrice: 50.0,
        description: 'Corte profissional',
        collaborators: [],
      },
      {
        id: '2',
        name: 'Manicure',
        defaultPrice: 30.0,
        description: 'Manicure completa',
        collaborators: [],
      },
    ];

    it('should return all services', async () => {
      repository.find.mockResolvedValue(mockServices);

      const result = await service.findAll();

      expect(result).toEqual(mockServices);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['collaborators'],
      });
    });

    it('should search services by name when search term is provided', async () => {
      const searchTerm = 'Corte';
      repository.searchByName.mockResolvedValue([mockServices[0]]);

      const result = await service.findAll(searchTerm);

      expect(result).toEqual([mockServices[0]]);
      expect(repository.searchByName).toHaveBeenCalledWith(searchTerm.trim());
      expect(repository.find).not.toHaveBeenCalled();
    });

    it('should not search when search term is empty', async () => {
      repository.find.mockResolvedValue(mockServices);

      await service.findAll('');

      expect(repository.find).toHaveBeenCalled();
      expect(repository.searchByName).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    const mockService: Service = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Corte de Cabelo',
      defaultPrice: 50.0,
      description: 'Corte profissional',
      collaborators: [],
    };

    it('should return service when found', async () => {
      repository.findById.mockResolvedValue(mockService);

      const result = await service.findById(mockService.id);

      expect(result).toEqual(mockService);
      expect(repository.findById).toHaveBeenCalledWith(mockService.id);
    });

    it('should return null when service not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateService', () => {
    const existingService: Service = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Corte de Cabelo',
      defaultPrice: 50.0,
      description: 'Corte profissional',
      collaborators: [],
    };

    const updatedService: Service = {
      ...existingService,
      name: 'Corte Premium',
      defaultPrice: 70.0,
    };

    it('should update service with valid data', async () => {
      const updateDto: UpdateServiceDto = {
        name: 'Corte Premium',
        defaultPrice: 70.0,
      };

      repository.findById.mockResolvedValueOnce(existingService);
      repository.findById.mockResolvedValueOnce(updatedService);
      repository.update.mockResolvedValue(undefined);

      const result = await service.updateService(existingService.id, updateDto);

      expect(result).toEqual(updatedService);
      expect(repository.update).toHaveBeenCalledWith(
        existingService.id,
        updateDto,
      );
    });

    it('should throw error when service not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateService('non-existent-id', { name: 'New Name' }),
      ).rejects.toThrow('Service not found');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw error when price is zero', async () => {
      repository.findById.mockResolvedValue(existingService);

      await expect(
        service.updateService(existingService.id, { defaultPrice: 0 }),
      ).rejects.toThrow('Price must be greater than zero');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw error when price is negative', async () => {
      repository.findById.mockResolvedValue(existingService);

      await expect(
        service.updateService(existingService.id, { defaultPrice: -10 }),
      ).rejects.toThrow('Price must be greater than zero');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should allow updating only name', async () => {
      const updateDto: UpdateServiceDto = { name: 'Novo Nome' };
      const updatedService: Service = {
        ...existingService,
        name: 'Novo Nome',
      };

      repository.findById.mockResolvedValueOnce(existingService);
      repository.findById.mockResolvedValueOnce(updatedService);
      repository.update.mockResolvedValue(undefined);

      await service.updateService(existingService.id, updateDto);

      expect(repository.update).toHaveBeenCalled();
    });

    it('should allow updating only description', async () => {
      const updateDto: UpdateServiceDto = { description: 'Nova descrição' };
      const updatedService: Service = {
        ...existingService,
        description: 'Nova descrição',
      };

      repository.findById.mockResolvedValueOnce(existingService);
      repository.findById.mockResolvedValueOnce(updatedService);
      repository.update.mockResolvedValue(undefined);

      await service.updateService(existingService.id, updateDto);

      expect(repository.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const existingService: Service = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Corte de Cabelo',
      defaultPrice: 50.0,
      description: 'Corte profissional',
      collaborators: [],
    };

    it('should delete service when found and not in use', async () => {
      repository.findById.mockResolvedValue(existingService);
      scheduledServiceRepository.find.mockResolvedValue([]);
      repository.delete.mockResolvedValue(undefined);

      await service.delete(existingService.id);

      expect(repository.findById).toHaveBeenCalledWith(existingService.id);
      expect(scheduledServiceRepository.find).toHaveBeenCalledWith({
        where: { serviceId: existingService.id },
      });
      expect(repository.delete).toHaveBeenCalledWith(existingService.id);
    });

    it('should throw error when service not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        'Service not found',
      );

      expect(scheduledServiceRepository.find).not.toHaveBeenCalled();
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when service is being used in scheduled services', async () => {
      repository.findById.mockResolvedValue(existingService);
      scheduledServiceRepository.find.mockResolvedValue([
        {
          id: 'scheduled-1',
          serviceId: existingService.id,
        } as any,
      ]);

      await expect(service.delete(existingService.id)).rejects.toThrow(
        'Cannot delete service that is being used in scheduled services',
      );

      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
