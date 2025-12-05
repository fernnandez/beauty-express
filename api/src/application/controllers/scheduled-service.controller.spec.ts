import {
  ScheduledService,
  ScheduledServiceStatus,
} from '@domain/entities/scheduled-service.entity';
import { ScheduledServiceService } from '@domain/services/scheduled-service.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateScheduledServiceDto } from '../dtos/scheduled-service/update-scheduled-service.dto';
import { ScheduledServiceController } from './scheduled-service.controller';

describe('ScheduledServiceController', () => {
  let controller: ScheduledServiceController;
  let service: ScheduledServiceService;

  const mockScheduledService: ScheduledService = {
    id: 'scheduled-1',
    appointmentId: 'appointment-1',
    serviceId: 'service-1',
    collaboratorId: 'collaborator-1',
    price: 50.0,
    status: ScheduledServiceStatus.PENDING,
  } as ScheduledService;

  const mockScheduledServiceService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByAppointmentId: jest.fn(),
    updateScheduledService: jest.fn(),
    completeScheduledService: jest.fn(),
    cancelScheduledService: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduledServiceController],
      providers: [
        {
          provide: ScheduledServiceService,
          useValue: mockScheduledServiceService,
        },
      ],
    }).compile();

    controller = module.get<ScheduledServiceController>(
      ScheduledServiceController,
    );
    service = module.get<ScheduledServiceService>(ScheduledServiceService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    const mockScheduledServices: ScheduledService[] = [mockScheduledService];

    it('should return all scheduled services', async () => {
      mockScheduledServiceService.findAll.mockResolvedValue(
        mockScheduledServices,
      );

      const result = await controller.findAll();

      expect(result).toEqual(mockScheduledServices);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a scheduled service by id', async () => {
      mockScheduledServiceService.findById.mockResolvedValue(
        mockScheduledService,
      );

      const result = await controller.findOne(mockScheduledService.id);

      expect(result).toEqual(mockScheduledService);
      expect(service.findById).toHaveBeenCalledWith(mockScheduledService.id);
    });

    it('should return null when scheduled service not found', async () => {
      mockScheduledServiceService.findById.mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByAppointmentId', () => {
    const mockScheduledServices: ScheduledService[] = [mockScheduledService];

    it('should return scheduled services for an appointment', async () => {
      mockScheduledServiceService.findByAppointmentId.mockResolvedValue(
        mockScheduledServices,
      );

      const result = await controller.findByAppointmentId('appointment-1');

      expect(result).toEqual(mockScheduledServices);
      expect(service.findByAppointmentId).toHaveBeenCalledWith('appointment-1');
    });
  });

  describe('update', () => {
    const updateDto: UpdateScheduledServiceDto = {
      price: 70.0,
      collaboratorId: 'collaborator-2',
    };

    const updatedScheduledService: ScheduledService = {
      ...mockScheduledService,
      ...updateDto,
    };

    it('should update a scheduled service', async () => {
      mockScheduledServiceService.updateScheduledService.mockResolvedValue(
        updatedScheduledService,
      );

      const result = await controller.update(
        mockScheduledService.id,
        updateDto,
      );

      expect(result).toEqual(updatedScheduledService);
      expect(service.updateScheduledService).toHaveBeenCalledWith(
        mockScheduledService.id,
        updateDto,
      );
    });
  });

  describe('complete', () => {
    const completedScheduledService: ScheduledService = {
      ...mockScheduledService,
      status: ScheduledServiceStatus.COMPLETED,
    };

    it('should complete a scheduled service', async () => {
      mockScheduledServiceService.completeScheduledService.mockResolvedValue(
        completedScheduledService,
      );

      const result = await controller.complete(mockScheduledService.id);

      expect(result).toEqual(completedScheduledService);
      expect(service.completeScheduledService).toHaveBeenCalledWith(
        mockScheduledService.id,
      );
    });
  });

  describe('cancel', () => {
    const cancelledScheduledService: ScheduledService = {
      ...mockScheduledService,
      status: ScheduledServiceStatus.CANCELLED,
    };

    it('should cancel a scheduled service', async () => {
      mockScheduledServiceService.cancelScheduledService.mockResolvedValue(
        cancelledScheduledService,
      );

      const result = await controller.cancel(mockScheduledService.id);

      expect(result).toEqual(cancelledScheduledService);
      expect(service.cancelScheduledService).toHaveBeenCalledWith(
        mockScheduledService.id,
      );
    });
  });
});
