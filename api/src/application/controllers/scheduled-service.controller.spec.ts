import {
  ScheduledService,
  ScheduledServiceStatus,
} from '@domain/entities/scheduled-service.entity';
import { ScheduledServiceService } from '@domain/services/scheduled-service.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateScheduledServiceDto } from '../dtos/scheduled-service/create-scheduled-service.dto';
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
    createScheduledService: jest.fn(),
    updateScheduledService: jest.fn(),
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

  describe('create', () => {
    const createDto: CreateScheduledServiceDto = {
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 50.0,
    };

    it('should create a scheduled service', async () => {
      mockScheduledServiceService.createScheduledService.mockResolvedValue(
        mockScheduledService,
      );

      const result = await controller.create('appointment-1', createDto);

      expect(result).toEqual(mockScheduledService);
      expect(service.createScheduledService).toHaveBeenCalledWith(
        'appointment-1',
        createDto,
      );
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
