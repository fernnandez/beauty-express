import { CreateScheduledServiceDto } from '@application/dtos/scheduled-service/create-scheduled-service.dto';
import { UpdateScheduledServiceDto } from '@application/dtos/scheduled-service/update-scheduled-service.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { Collaborator } from '../entities/collaborator.entity';
import { Commission } from '../entities/commission.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';
import { Service } from '../entities/service.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { ScheduledServiceService } from './scheduled-service.service';

describe('ScheduledServiceService', () => {
  let service: ScheduledServiceService;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByAppointmentId: jest.fn(),
    update: jest.fn(),
  };

  const mockServiceRepository = {
    findById: jest.fn(),
  };

  const mockCollaboratorRepository = {
    findById: jest.fn(),
  };

  const mockCommissionRepository = {
    findByScheduledServiceId: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledServiceService,
        {
          provide: ScheduledServiceRepository,
          useValue: mockRepository,
        },
        {
          provide: ServiceRepository,
          useValue: mockServiceRepository,
        },
        {
          provide: CollaboratorRepository,
          useValue: mockCollaboratorRepository,
        },
        {
          provide: CommissionRepository,
          useValue: mockCommissionRepository,
        },
      ],
    }).compile();

    service = module.get<ScheduledServiceService>(ScheduledServiceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createScheduledService', () => {
    const mockService: Service = {
      id: 'service-1',
      name: 'Corte de Cabelo',
      defaultPrice: 50.0,
      description: 'Corte profissional',
      collaborators: [],
    };

    const mockCollaborator: Collaborator = {
      id: 'collaborator-1',
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
      isActive: true,
      services: [],
    };

    const createDto: CreateScheduledServiceDto = {
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 50.0,
    };

    const expectedScheduledService: ScheduledService = {
      id: 'scheduled-1',
      appointmentId: 'appointment-1',
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 50.0,
      status: ScheduledServiceStatus.PENDING,
    } as ScheduledService;

    it('should create scheduled service with valid data', async () => {
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockCollaboratorRepository.findById.mockResolvedValue(mockCollaborator);
      mockRepository.save.mockResolvedValue(expectedScheduledService);

      const result = await service.createScheduledService(
        'appointment-1',
        createDto,
      );

      expect(result).toEqual(expectedScheduledService);
      expect(mockServiceRepository.findById).toHaveBeenCalledWith('service-1');
      expect(mockCollaboratorRepository.findById).toHaveBeenCalledWith(
        'collaborator-1',
      );
      expect(mockRepository.save).toHaveBeenCalledWith({
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        collaboratorId: 'collaborator-1',
        price: 50.0,
        status: ScheduledServiceStatus.PENDING,
      });
    });

    it('should use default price when price is not provided', async () => {
      const dtoWithoutPrice: CreateScheduledServiceDto = {
        serviceId: 'service-1',
      };

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockRepository.save.mockResolvedValue({
        ...expectedScheduledService,
        price: mockService.defaultPrice,
      });

      await service.createScheduledService('appointment-1', dtoWithoutPrice);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          price: mockService.defaultPrice,
        }),
      );
    });

    it('should throw error when service not found', async () => {
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(
        service.createScheduledService('appointment-1', createDto),
      ).rejects.toThrow('Service not found');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when collaborator not found', async () => {
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockCollaboratorRepository.findById.mockResolvedValue(null);

      await expect(
        service.createScheduledService('appointment-1', createDto),
      ).rejects.toThrow('Collaborator not found');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when collaborator is not active', async () => {
      const inactiveCollaborator: Collaborator = {
        ...mockCollaborator,
        isActive: false,
      };

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockCollaboratorRepository.findById.mockResolvedValue(
        inactiveCollaborator,
      );

      await expect(
        service.createScheduledService('appointment-1', createDto),
      ).rejects.toThrow('Collaborator is not active');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should create scheduled service without collaborator', async () => {
      const dtoWithoutCollaborator: CreateScheduledServiceDto = {
        serviceId: 'service-1',
        price: 50.0,
      };

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockRepository.save.mockResolvedValue({
        ...expectedScheduledService,
        collaboratorId: undefined,
      });

      await service.createScheduledService(
        'appointment-1',
        dtoWithoutCollaborator,
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          collaboratorId: undefined,
        }),
      );
      expect(mockCollaboratorRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('findByAppointmentId', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        price: 50.0,
        status: ScheduledServiceStatus.PENDING,
      } as ScheduledService,
    ];

    it('should return scheduled services for appointment', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(
        mockScheduledServices,
      );

      const result = await service.findByAppointmentId('appointment-1');

      expect(result).toEqual(mockScheduledServices);
      expect(mockRepository.findByAppointmentId).toHaveBeenCalledWith(
        'appointment-1',
      );
    });
  });

  describe('updateScheduledService', () => {
    const existingScheduledService: ScheduledService = {
      id: 'scheduled-1',
      appointmentId: 'appointment-1',
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 50.0,
      status: ScheduledServiceStatus.PENDING,
    } as ScheduledService;

    const mockCollaborator: Collaborator = {
      id: 'collaborator-1',
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
      isActive: true,
      services: [],
    };

    it('should update scheduled service with valid data', async () => {
      const updateDto: UpdateScheduledServiceDto = {
        price: 70.0,
      };

      const updatedScheduledService: ScheduledService = {
        ...existingScheduledService,
        price: 70.0,
      };

      mockRepository.findById.mockResolvedValueOnce(existingScheduledService);
      mockRepository.findById.mockResolvedValueOnce(updatedScheduledService);
      mockRepository.update.mockResolvedValue(undefined);

      const result = await service.updateScheduledService(
        'scheduled-1',
        updateDto,
      );

      expect(result).toEqual(updatedScheduledService);
      expect(mockRepository.update).toHaveBeenCalledWith('scheduled-1', {
        price: 70.0,
      });
    });

    it('should throw error when scheduled service not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateScheduledService('non-existent-id', { price: 70.0 }),
      ).rejects.toThrow('ScheduledService not found');

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when trying to update non-pending service', async () => {
      const completedService: ScheduledService = {
        ...existingScheduledService,
        status: ScheduledServiceStatus.COMPLETED,
      };

      mockRepository.findById.mockResolvedValue(completedService);

      await expect(
        service.updateScheduledService('scheduled-1', { price: 70.0 }),
      ).rejects.toThrow('Can only update pending scheduled services');

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update serviceId and use default price when price not provided', async () => {
      const updateDto: UpdateScheduledServiceDto = {
        serviceId: 'service-2',
      };

      const newService: Service = {
        id: 'service-2',
        name: 'Manicure',
        defaultPrice: 30.0,
        collaborators: [],
      };

      const updatedScheduledService: ScheduledService = {
        ...existingScheduledService,
        serviceId: 'service-2',
        price: 30.0,
      };

      mockRepository.findById.mockResolvedValueOnce(existingScheduledService);
      mockServiceRepository.findById.mockResolvedValue(newService);
      mockRepository.findById.mockResolvedValueOnce(updatedScheduledService);
      mockRepository.update.mockResolvedValue(undefined);

      await service.updateScheduledService('scheduled-1', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('scheduled-1', {
        serviceId: 'service-2',
        price: 30.0,
      });
    });

    it('should throw error when new service not found', async () => {
      const updateDto: UpdateScheduledServiceDto = {
        serviceId: 'non-existent-service',
      };

      mockRepository.findById.mockResolvedValue(existingScheduledService);
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateScheduledService('scheduled-1', updateDto),
      ).rejects.toThrow('Service not found');

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update collaboratorId', async () => {
      const updateDto: UpdateScheduledServiceDto = {
        collaboratorId: 'collaborator-2',
      };

      const newCollaborator: Collaborator = {
        ...mockCollaborator,
        id: 'collaborator-2',
      };

      const updatedScheduledService: ScheduledService = {
        ...existingScheduledService,
        collaboratorId: 'collaborator-2',
      };

      mockRepository.findById.mockResolvedValueOnce(existingScheduledService);
      mockCollaboratorRepository.findById.mockResolvedValue(newCollaborator);
      mockRepository.findById.mockResolvedValueOnce(updatedScheduledService);
      mockRepository.update.mockResolvedValue(undefined);

      await service.updateScheduledService('scheduled-1', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('scheduled-1', {
        collaboratorId: 'collaborator-2',
      });
    });

    it('should throw error when new collaborator not found', async () => {
      const updateDto: UpdateScheduledServiceDto = {
        collaboratorId: 'non-existent-collaborator',
      };

      mockRepository.findById.mockResolvedValue(existingScheduledService);
      mockCollaboratorRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateScheduledService('scheduled-1', updateDto),
      ).rejects.toThrow('Collaborator not found');

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when new collaborator is not active', async () => {
      const updateDto: UpdateScheduledServiceDto = {
        collaboratorId: 'collaborator-2',
      };

      const inactiveCollaborator: Collaborator = {
        ...mockCollaborator,
        id: 'collaborator-2',
        isActive: false,
      };

      mockRepository.findById.mockResolvedValue(existingScheduledService);
      mockCollaboratorRepository.findById.mockResolvedValue(
        inactiveCollaborator,
      );

      await expect(
        service.updateScheduledService('scheduled-1', updateDto),
      ).rejects.toThrow('Collaborator is not active');

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should allow removing collaborator by setting to null', async () => {
      const updateDto: UpdateScheduledServiceDto = {
        collaboratorId: null as any,
      };

      const updatedScheduledService: ScheduledService = {
        ...existingScheduledService,
        collaboratorId: undefined,
      };

      mockRepository.findById.mockResolvedValueOnce(existingScheduledService);
      mockRepository.findById.mockResolvedValueOnce(updatedScheduledService);
      mockRepository.update.mockResolvedValue(undefined);

      await service.updateScheduledService('scheduled-1', updateDto);

      // Quando collaboratorId é null/undefined, o código usa || undefined, então pode não chamar update se não houver outras mudanças
      // Mas se houver collaboratorId no updateDto, deve chamar update
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe('completeScheduledService', () => {
    const pendingScheduledService: ScheduledService = {
      id: 'scheduled-1',
      appointmentId: 'appointment-1',
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 50.0,
      status: ScheduledServiceStatus.PENDING,
    } as ScheduledService;

    const completedScheduledService: ScheduledService = {
      ...pendingScheduledService,
      status: ScheduledServiceStatus.COMPLETED,
    };

    const mockCollaborator: Collaborator = {
      id: 'collaborator-1',
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
      isActive: true,
      services: [],
    };

    const mockCommission: Commission = {
      id: 'commission-1',
      collaboratorId: 'collaborator-1',
      scheduledServiceId: 'scheduled-1',
      amount: 5.0,
      percentage: 10,
      paid: false,
    };

    it('should complete scheduled service and create commission', async () => {
      mockRepository.findById.mockResolvedValueOnce(pendingScheduledService);
      mockRepository.save.mockResolvedValue(completedScheduledService);
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(null);
      mockCollaboratorRepository.findById.mockResolvedValue(mockCollaborator);
      mockCommissionRepository.save.mockResolvedValue(mockCommission);

      const result = await service.completeScheduledService('scheduled-1');

      expect(result).toEqual(completedScheduledService);
      expect(result.status).toBe(ScheduledServiceStatus.COMPLETED);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCommissionRepository.save).toHaveBeenCalled();
    });

    it('should throw error when scheduled service not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.completeScheduledService('non-existent-id'),
      ).rejects.toThrow('ScheduledService not found');
    });

    it('should throw error when scheduled service is not pending', async () => {
      const completedService: ScheduledService = {
        ...pendingScheduledService,
        status: ScheduledServiceStatus.COMPLETED,
      };

      mockRepository.findById.mockResolvedValue(completedService);

      await expect(
        service.completeScheduledService('scheduled-1'),
      ).rejects.toThrow('Can only complete pending scheduled services');
    });

    it('should throw error when scheduled service has no collaborator', async () => {
      const serviceWithoutCollaborator: ScheduledService = {
        ...pendingScheduledService,
        collaboratorId: undefined,
        status: ScheduledServiceStatus.PENDING,
      };

      mockRepository.findById.mockResolvedValue(serviceWithoutCollaborator);

      await expect(
        service.completeScheduledService('scheduled-1'),
      ).rejects.toThrow(
        'ScheduledService must have a collaborator assigned to be completed',
      );
    });

    it('should return existing commission if already exists', async () => {
      const serviceWithCollaborator: ScheduledService = {
        ...pendingScheduledService,
        collaboratorId: 'collaborator-1',
        status: ScheduledServiceStatus.PENDING,
      };

      mockRepository.findById.mockResolvedValueOnce(serviceWithCollaborator);
      mockRepository.save.mockResolvedValue(completedScheduledService);
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(
        mockCommission,
      );

      const result = await service.completeScheduledService('scheduled-1');

      expect(result).toEqual(completedScheduledService);
      expect(mockCommissionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('cancelScheduledService', () => {
    const pendingScheduledService: ScheduledService = {
      id: 'scheduled-1',
      appointmentId: 'appointment-1',
      serviceId: 'service-1',
      price: 50.0,
      status: ScheduledServiceStatus.PENDING,
    } as ScheduledService;

    const cancelledScheduledService: ScheduledService = {
      ...pendingScheduledService,
      status: ScheduledServiceStatus.CANCELLED,
    };

    it('should allow canceling pending service', async () => {
      mockRepository.findById.mockResolvedValue(pendingScheduledService);
      mockRepository.save.mockResolvedValue(cancelledScheduledService);

      const result = await service.cancelScheduledService('scheduled-1');

      expect(result.status).toBe(ScheduledServiceStatus.CANCELLED);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when scheduled service not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.cancelScheduledService('non-existent-id'),
      ).rejects.toThrow('ScheduledService not found');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should allow canceling completed service', async () => {
      const completedService: ScheduledService = {
        ...pendingScheduledService,
        status: ScheduledServiceStatus.COMPLETED,
      };

      const cancelledService: ScheduledService = {
        ...completedService,
        status: ScheduledServiceStatus.CANCELLED,
      };

      mockRepository.findById.mockImplementationOnce(() =>
        Promise.resolve(completedService),
      );
      mockRepository.save.mockImplementationOnce(() =>
        Promise.resolve(cancelledService),
      );

      const result = await service.cancelScheduledService('scheduled-1');

      expect(result.status).toBe(ScheduledServiceStatus.CANCELLED);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should return service without saving if already cancelled', async () => {
      const alreadyCancelledService: ScheduledService = {
        ...pendingScheduledService,
        status: ScheduledServiceStatus.CANCELLED,
      };

      mockRepository.findById.mockImplementationOnce(() =>
        Promise.resolve(alreadyCancelledService),
      );

      const result = await service.cancelScheduledService('scheduled-1');

      expect(result.status).toBe(ScheduledServiceStatus.CANCELLED);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
