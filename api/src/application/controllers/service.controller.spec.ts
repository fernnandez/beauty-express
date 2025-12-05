import { Test, TestingModule } from '@nestjs/testing';
import { ServiceController } from './service.controller';
import { ServiceService } from '@domain/services/service.service';
import { Service } from '@domain/entities/service.entity';
import { CreateServiceDto } from '../dtos/service/create-service.dto';
import { UpdateServiceDto } from '../dtos/service/update-service.dto';

describe('ServiceController', () => {
  let controller: ServiceController;
  let service: ServiceService;

  const mockService: Service = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Corte de Cabelo',
    defaultPrice: 50.0,
    description: 'Corte profissional',
    collaborators: [],
  };

  const mockServiceService = {
    createService: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateService: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        {
          provide: ServiceService,
          useValue: mockServiceService,
        },
      ],
    }).compile();

    controller = module.get<ServiceController>(ServiceController);
    service = module.get<ServiceService>(ServiceService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateServiceDto = {
      name: 'Corte de Cabelo',
      defaultPrice: 50.0,
      description: 'Corte profissional',
    };

    it('should create a service', async () => {
      mockServiceService.createService.mockResolvedValue(mockService);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockService);
      expect(service.createService).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    const mockServices: Service[] = [mockService];

    it('should return all services', async () => {
      mockServiceService.findAll.mockResolvedValue(mockServices);

      const result = await controller.findAll();

      expect(result).toEqual(mockServices);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should search services when search query is provided', async () => {
      const searchTerm = 'Corte';
      mockServiceService.findAll.mockResolvedValue([mockService]);

      const result = await controller.findAll(searchTerm);

      expect(result).toEqual([mockService]);
      expect(service.findAll).toHaveBeenCalledWith(searchTerm);
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      mockServiceService.findById.mockResolvedValue(mockService);

      const result = await controller.findOne(mockService.id);

      expect(result).toEqual(mockService);
      expect(service.findById).toHaveBeenCalledWith(mockService.id);
    });
  });

  describe('update', () => {
    const updateDto: UpdateServiceDto = {
      name: 'Corte Premium',
      defaultPrice: 70.0,
    };

    const updatedService: Service = {
      ...mockService,
      ...updateDto,
    };

    it('should update a service', async () => {
      mockServiceService.updateService.mockResolvedValue(updatedService);

      const result = await controller.update(mockService.id, updateDto);

      expect(result).toEqual(updatedService);
      expect(service.updateService).toHaveBeenCalledWith(mockService.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      mockServiceService.delete.mockResolvedValue(undefined);

      await controller.remove(mockService.id);

      expect(service.delete).toHaveBeenCalledWith(mockService.id);
    });
  });
});

