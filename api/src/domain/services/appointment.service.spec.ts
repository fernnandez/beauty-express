import { CreateAppointmentDto } from '@application/dtos/appointment/create-appointment.dto';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { parseDateString } from '../../utils/date.util';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';
import { Service } from '../entities/service.entity';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { AppointmentService } from './appointment.service';
import { ClientService } from './client.service';
import { CommissionService } from './commission.service';
import { ScheduledServiceService } from './scheduled-service.service';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { TenantContextService } from './tenant-context.service';
import { mockTenantContextService } from '../../test/tenant-context.mock';

describe('AppointmentService', () => {
  let service: AppointmentService;

  const mockAppointmentRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockScheduledServiceRepository = {
    findByAppointmentId: jest.fn(),
  };

  const mockServiceRepository = {
    findById: jest.fn(),
  };

  const mockScheduledServiceService = {
    createScheduledService: jest.fn(),
    updateScheduledService: jest.fn(),
    cancelScheduledService: jest.fn(),
    completeScheduledService: jest.fn(),
    reopenScheduledService: jest.fn(),
  };

  const mockCommissionService = {
    calculateCommissionsForAppointment: jest.fn(),
    getAppointmentEditability: jest.fn().mockResolvedValue({
      canEditAppointment: true,
      canReopenAppointment: false,
      services: {},
    }),
    assertAppointmentCommissionsEditable: jest.fn(),
  };

  const mockClientService = {
    resolveClientForAppointment: jest.fn(
      (clientName: string, clientPhone: string, clientId?: string) =>
        Promise.resolve({
          clientId: clientId ?? 'client-1',
          clientName,
          clientPhone,
        }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: AppointmentRepository,
          useValue: mockAppointmentRepository,
        },
        {
          provide: ScheduledServiceRepository,
          useValue: mockScheduledServiceRepository,
        },
        {
          provide: ServiceRepository,
          useValue: mockServiceRepository,
        },
        {
          provide: ScheduledServiceService,
          useValue: mockScheduledServiceService,
        },
        {
          provide: CommissionService,
          useValue: mockCommissionService,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile();

    service = await module.resolve<AppointmentService>(AppointmentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAppointment', () => {
    const mockService: Service = {
      id: 'service-1',
      tenantId: TENANT_ID_MOCK,
      name: 'Corte de Cabelo',
      defaultPrice: 50.0,
      description: 'Corte profissional',
      collaborators: [],
    };

    const createDto: CreateAppointmentDto = {
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: '2026-12-28',
      startTime: '09:00',
      endTime: '11:00',
      servicos: [
        {
          serviceId: 'service-1',
        },
      ],
    };

    const savedAppointment: Appointment = {
      id: 'appointment-1',
      tenantId: TENANT_ID_MOCK,
      clientName: createDto.clientName,
      clientPhone: createDto.clientPhone,
      date: parseDateString(createDto.date),
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      status: AppointmentStatus.SCHEDULED,
      observations: null,
      scheduledServices: [],
    };

    const appointmentWithServices: Appointment = {
      ...savedAppointment,
      scheduledServices: [
        {
          id: 'scheduled-1',
        tenantId: TENANT_ID_MOCK,
          appointmentId: savedAppointment.id,
          serviceId: 'service-1',
          price: 50.0,
          status: ScheduledServiceStatus.PENDING,
        } as ScheduledService,
      ],
    };

    it('should create appointment with valid data', async () => {
      mockAppointmentRepository.save.mockResolvedValue(savedAppointment);
      mockScheduledServiceService.createScheduledService.mockResolvedValue(
        appointmentWithServices.scheduledServices[0],
      );
      mockAppointmentRepository.findById.mockResolvedValue(
        appointmentWithServices,
      );

      const result = await service.createAppointment(createDto);

      expect(result).toEqual(
        expect.objectContaining({
          ...appointmentWithServices,
          editability: {
            canEditAppointment: true,
            canReopenAppointment: false,
            services: {},
          },
        }),
      );
      expect(mockAppointmentRepository.save).toHaveBeenCalled();
      expect(
        mockScheduledServiceService.createScheduledService,
      ).toHaveBeenCalled();
    });

    it('should throw error when no services provided', async () => {
      const invalidDto = { ...createDto, servicos: [] };

      await expect(service.createAppointment(invalidDto)).rejects.toThrow(
        'Appointment must have at least one service',
      );

      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when start time is after end time', async () => {
      const invalidDto = {
        ...createDto,
        startTime: '11:00',
        endTime: '09:00',
      };

      await expect(service.createAppointment(invalidDto)).rejects.toThrow(
        'Start time must be before end time',
      );

      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when start time equals end time', async () => {
      const invalidDto = {
        ...createDto,
        startTime: '09:00',
        endTime: '09:00',
      };

      await expect(service.createAppointment(invalidDto)).rejects.toThrow(
        'Start time must be before end time',
      );

      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when time format is invalid', async () => {
      const invalidDto = {
        ...createDto,
        startTime: '25:00',
        endTime: '11:00',
      };

      await expect(service.createAppointment(invalidDto)).rejects.toThrow(
        'Invalid time format. Use HH:MM format',
      );

      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when service not found', async () => {
      mockAppointmentRepository.save.mockResolvedValue(savedAppointment);
      mockScheduledServiceService.createScheduledService.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(service.createAppointment(createDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockAppointmentRepository.save).toHaveBeenCalled();
    });

    it('should throw error when past appointment has service without collaborator', async () => {
      const pastDto = { ...createDto, date: '2024-12-28' };

      await expect(service.createAppointment(pastDto)).rejects.toThrow(
        'Past appointments require a collaborator assigned to each service',
      );

      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
    });

    it('should auto-complete past appointment when all services have collaborators', async () => {
      const pastDto: CreateAppointmentDto = {
        ...createDto,
        date: '2024-12-28',
        servicos: [
          {
            serviceId: 'service-1',
            collaboratorId: 'collab-1',
          },
        ],
      };

      const pastSavedAppointment: Appointment = {
        ...savedAppointment,
        date: parseDateString('2024-12-28'),
      };

      const scheduledService: ScheduledService = {
        id: 'scheduled-1',
      tenantId: TENANT_ID_MOCK,
        appointmentId: pastSavedAppointment.id,
        serviceId: 'service-1',
        collaboratorId: 'collab-1',
        price: 50.0,
        status: ScheduledServiceStatus.PENDING,
      };

      const completedAppointment: Appointment = {
        ...pastSavedAppointment,
        status: AppointmentStatus.COMPLETED,
        scheduledServices: [
          {
            ...scheduledService,
            status: ScheduledServiceStatus.COMPLETED,
          },
        ],
      };

      mockAppointmentRepository.save
        .mockResolvedValueOnce(pastSavedAppointment)
        .mockResolvedValueOnce(completedAppointment);
      mockScheduledServiceService.createScheduledService.mockResolvedValue(
        scheduledService,
      );
      mockAppointmentRepository.findById.mockResolvedValue({
        ...pastSavedAppointment,
        scheduledServices: [scheduledService],
      });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue([
        scheduledService,
      ]);
      mockScheduledServiceService.completeScheduledService.mockResolvedValue({
        ...scheduledService,
        status: ScheduledServiceStatus.COMPLETED,
      });
      mockCommissionService.calculateCommissionsForAppointment.mockResolvedValue(
        [],
      );

      const result = await service.createAppointment(pastDto);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(
        mockScheduledServiceService.completeScheduledService,
      ).toHaveBeenCalledWith('scheduled-1');
      expect(
        mockCommissionService.calculateCommissionsForAppointment,
      ).toHaveBeenCalledWith(pastSavedAppointment.id);
    });

    it('should create appointment with custom price', async () => {
      const dtoWithCustomPrice = {
        ...createDto,
        servicos: [
          {
            serviceId: 'service-1',
            price: 70.0,
          },
        ],
      };

      mockAppointmentRepository.save.mockResolvedValue(savedAppointment);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockScheduledServiceService.createScheduledService.mockResolvedValue({
        ...appointmentWithServices.scheduledServices[0],
        price: 70.0,
      });
      mockAppointmentRepository.findById.mockResolvedValue(
        appointmentWithServices,
      );

      await service.createAppointment(dtoWithCustomPrice);

      expect(
        mockScheduledServiceService.createScheduledService,
      ).toHaveBeenCalledWith(
        savedAppointment.id,
        expect.objectContaining({ price: 70.0 }),
      );
    });

    it('should create appointment with collaborator assigned', async () => {
      const dtoWithCollaborator = {
        ...createDto,
        servicos: [
          {
            serviceId: 'service-1',
            collaboratorId: 'collaborator-1',
          },
        ],
      };

      mockAppointmentRepository.save.mockResolvedValue(savedAppointment);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockScheduledServiceService.createScheduledService.mockResolvedValue(
        appointmentWithServices.scheduledServices[0],
      );
      mockAppointmentRepository.findById.mockResolvedValue(
        appointmentWithServices,
      );

      await service.createAppointment(dtoWithCollaborator);

      expect(
        mockScheduledServiceService.createScheduledService,
      ).toHaveBeenCalledWith(
        savedAppointment.id,
        expect.objectContaining({ collaboratorId: 'collaborator-1' }),
      );
    });

    it('should handle empty observations', async () => {
      const dtoWithEmptyObservations = {
        ...createDto,
        observations: '',
      };

      mockAppointmentRepository.save.mockResolvedValue(savedAppointment);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockScheduledServiceService.createScheduledService.mockResolvedValue(
        appointmentWithServices.scheduledServices[0],
      );
      mockAppointmentRepository.findById.mockResolvedValue(
        appointmentWithServices,
      );

      await service.createAppointment(dtoWithEmptyObservations);

      expect(mockAppointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ observations: null }),
      );
    });

    it('should trim observations', async () => {
      const dtoWithTrimmedObservations = {
        ...createDto,
        observations: '  Observação com espaços  ',
      };

      mockAppointmentRepository.save.mockResolvedValue(savedAppointment);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockScheduledServiceService.createScheduledService.mockResolvedValue(
        appointmentWithServices.scheduledServices[0],
      );
      mockAppointmentRepository.findById.mockResolvedValue(
        appointmentWithServices,
      );

      await service.createAppointment(dtoWithTrimmedObservations);

      expect(mockAppointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ observations: 'Observação com espaços' }),
      );
    });
  });

  describe('findAll', () => {
    const mockAppointments: Appointment[] = [
      {
        id: 'appointment-1',
        tenantId: TENANT_ID_MOCK,
        clientName: 'João Silva',
        clientPhone: '11999999999',
        date: new Date('2024-12-28'),
        startTime: '09:00',
        endTime: '11:00',
        status: AppointmentStatus.SCHEDULED,
        scheduledServices: [],
      },
    ];

    it('should return all appointments', async () => {
      mockAppointmentRepository.find.mockResolvedValue(mockAppointments);

      const result = await service.findAll();

      expect(result).toEqual(mockAppointments);
      expect(mockAppointmentRepository.find).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID_MOCK },
        relations: [
          'scheduledServices',
          'scheduledServices.service',
          'scheduledServices.collaborator',
        ],
      });
    });
  });

  describe('findById', () => {
    const mockAppointment: Appointment = {
      id: 'appointment-1',
      tenantId: TENANT_ID_MOCK,
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: new Date('2024-12-28'),
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
      scheduledServices: [],
    };

    it('should return appointment when found', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);

      const result = await service.findById(mockAppointment.id);

      expect(result).toEqual({
        ...mockAppointment,
        editability: {
          canEditAppointment: true,
          canReopenAppointment: false,
          services: {},
        },
      });
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(mockAppointment.id, TENANT_ID_MOCK);
    });

    it('should return null when appointment not found', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('completeAppointment', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        tenantId: TENANT_ID_MOCK,
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        collaboratorId: 'collaborator-1',
        price: 50.0,
        status: ScheduledServiceStatus.COMPLETED,
      } as ScheduledService,
    ];

    const mockAppointment: Appointment = {
      id: 'appointment-1',
      tenantId: TENANT_ID_MOCK,
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: new Date('2024-12-28'),
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
      scheduledServices: mockScheduledServices,
    };

    it('should complete appointment when all services are completed and have collaborators', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        mockScheduledServices,
      );
      mockAppointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });
      mockCommissionService.calculateCommissionsForAppointment.mockResolvedValue(
        [],
      );

      const result = await service.completeAppointment(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(mockAppointmentRepository.save).toHaveBeenCalled();
      expect(
        mockCommissionService.calculateCommissionsForAppointment,
      ).toHaveBeenCalledWith(mockAppointment.id);
    });

    it('should throw error when appointment not found', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(null);

      await expect(
        service.completeAppointment('non-existent-id'),
      ).rejects.toThrow('Appointment not found');
    });

    it('should complete pending services automatically before completing appointment', async () => {
      const incompleteServices: ScheduledService[] = [
        {
          ...mockScheduledServices[0],
          status: ScheduledServiceStatus.PENDING,
        } as ScheduledService,
      ];

      const completedService: ScheduledService = {
        ...incompleteServices[0],
        status: ScheduledServiceStatus.COMPLETED,
      } as ScheduledService;

      mockAppointmentRepository.findById.mockResolvedValue({
        ...mockAppointment,
        scheduledServices: incompleteServices,
      });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        incompleteServices,
      );
      mockScheduledServiceService.completeScheduledService.mockResolvedValue(
        completedService,
      );
      mockAppointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });
      mockCommissionService.calculateCommissionsForAppointment.mockResolvedValue(
        [],
      );

      const result = await service.completeAppointment(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(
        mockScheduledServiceService.completeScheduledService,
      ).toHaveBeenCalledWith(incompleteServices[0].id);
      expect(
        mockCommissionService.calculateCommissionsForAppointment,
      ).toHaveBeenCalledWith(mockAppointment.id);
    });

    it('should throw error when services do not have collaborators', async () => {
      const servicesWithoutCollaborator: ScheduledService[] = [
        {
          ...mockScheduledServices[0],
          status: ScheduledServiceStatus.PENDING,
          collaboratorId: undefined,
        } as ScheduledService,
      ];

      mockAppointmentRepository.findById.mockResolvedValue({
        ...mockAppointment,
        scheduledServices: servicesWithoutCollaborator,
      });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        servicesWithoutCollaborator,
      );

      await expect(
        service.completeAppointment(mockAppointment.id),
      ).rejects.toThrow(
        'All scheduled services must have a collaborator assigned before completing the appointment',
      );
    });

    it('should throw error when appointment has no scheduled services', async () => {
      mockAppointmentRepository.findById.mockResolvedValue({
        ...mockAppointment,
        scheduledServices: [],
      });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue([]);

      await expect(
        service.completeAppointment(mockAppointment.id),
      ).rejects.toThrow('Appointment must have at least one scheduled service');
    });

    it('should throw error when all services are cancelled', async () => {
      const cancelledServices: ScheduledService[] = [
        {
          ...mockScheduledServices[0],
          status: ScheduledServiceStatus.CANCELLED,
        } as ScheduledService,
      ];

      mockAppointmentRepository.findById.mockResolvedValue({
        ...mockAppointment,
        scheduledServices: cancelledServices,
      });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        cancelledServices,
      );

      await expect(
        service.completeAppointment(mockAppointment.id),
      ).rejects.toThrow(
        'Appointment must have at least one non-cancelled service',
      );
    });

    it('should allow completing when some services are cancelled', async () => {
      const mixedServices: ScheduledService[] = [
        {
          ...mockScheduledServices[0],
          status: ScheduledServiceStatus.COMPLETED,
        } as ScheduledService,
        {
          id: 'scheduled-2',
        tenantId: TENANT_ID_MOCK,
          appointmentId: 'appointment-1',
          serviceId: 'service-2',
          collaboratorId: 'collaborator-2',
          price: 30.0,
          status: ScheduledServiceStatus.CANCELLED,
        } as ScheduledService,
      ];

      mockAppointmentRepository.findById.mockResolvedValue({
        ...mockAppointment,
        scheduledServices: mixedServices,
      });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        mixedServices,
      );
      mockAppointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });
      mockCommissionService.calculateCommissionsForAppointment.mockResolvedValue(
        [],
      );

      const result = await service.completeAppointment(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(
        mockCommissionService.calculateCommissionsForAppointment,
      ).toHaveBeenCalledWith(mockAppointment.id);
    });
  });

  describe('cancelAppointment', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        tenantId: TENANT_ID_MOCK,
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        price: 50.0,
        status: ScheduledServiceStatus.PENDING,
      } as ScheduledService,
    ];

    const mockAppointment: Appointment = {
      id: 'appointment-1',
      tenantId: TENANT_ID_MOCK,
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: new Date('2024-12-28'),
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
      scheduledServices: mockScheduledServices,
    };

    it('should cancel appointment', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        mockScheduledServices,
      );
      mockScheduledServiceService.cancelScheduledService.mockResolvedValue({
        ...mockScheduledServices[0],
        status: ScheduledServiceStatus.CANCELLED,
      });
      mockAppointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      const result = await service.cancelAppointment(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(
        mockScheduledServiceService.cancelScheduledService,
      ).toHaveBeenCalled();
    });

    it('should throw error when appointment not found', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(null);

      await expect(
        service.cancelAppointment('non-existent-id'),
      ).rejects.toThrow('Appointment not found');
    });

    it('should throw error when trying to cancel completed appointment', async () => {
      const completedAppointment: Appointment = {
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      };

      mockAppointmentRepository.findById.mockResolvedValue(completedAppointment);

      await expect(
        service.cancelAppointment(mockAppointment.id),
      ).rejects.toThrow('Cannot cancel completed appointments');
    });
  });

  describe('reopenAppointment', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        tenantId: TENANT_ID_MOCK,
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        price: 50.0,
        status: ScheduledServiceStatus.COMPLETED,
      } as ScheduledService,
    ];

    const mockAppointment: Appointment = {
      id: 'appointment-1',
      tenantId: TENANT_ID_MOCK,
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: new Date('2024-12-28'),
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.COMPLETED,
      scheduledServices: mockScheduledServices,
    };

    it('should reopen completed appointment', async () => {
      const completedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      };

      mockAppointmentRepository.findById
        .mockResolvedValueOnce(completedAppointment)
        .mockResolvedValueOnce({
          ...completedAppointment,
          status: AppointmentStatus.SCHEDULED,
        });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        mockScheduledServices,
      );
      mockScheduledServiceService.reopenScheduledService.mockResolvedValue({
        ...mockScheduledServices[0],
        status: ScheduledServiceStatus.PENDING,
      });
      mockAppointmentRepository.save.mockResolvedValue({
        ...completedAppointment,
        status: AppointmentStatus.SCHEDULED,
      });

      const result = await service.reopenAppointment(completedAppointment.id);

      expect(result.status).toBe(AppointmentStatus.SCHEDULED);
      expect(
        mockCommissionService.assertAppointmentCommissionsEditable,
      ).toHaveBeenCalledWith(mockAppointment.id);
      expect(
        mockScheduledServiceService.reopenScheduledService,
      ).toHaveBeenCalledWith('scheduled-1');
    });

    it('should throw error when appointment not found', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(null);

      await expect(
        service.reopenAppointment('non-existent-id'),
      ).rejects.toThrow('Appointment not found');
    });

    it('should throw error when trying to reopen scheduled appointment', async () => {
      const scheduledAppointment: Appointment = {
        ...mockAppointment,
        status: AppointmentStatus.SCHEDULED,
      };

      mockAppointmentRepository.findById.mockResolvedValue(scheduledAppointment);

      await expect(
        service.reopenAppointment(mockAppointment.id),
      ).rejects.toThrow('Can only reopen completed appointments');
    });

    it('should throw error when appointment has no completed services', async () => {
      const completedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      };

      mockAppointmentRepository.findById.mockResolvedValue(completedAppointment);
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue([
        {
          ...mockScheduledServices[0],
          status: ScheduledServiceStatus.PENDING,
        },
      ]);

      await expect(
        service.reopenAppointment(mockAppointment.id),
      ).rejects.toThrow('Appointment has no completed services to reopen');
    });
  });

  describe('updateAppointment', () => {
    const mockAppointment: Appointment = {
      id: 'appointment-1',
      tenantId: TENANT_ID_MOCK,
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: new Date('2024-12-28'),
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
      scheduledServices: [],
    };

    it('should update scheduled appointment', async () => {
      mockAppointmentRepository.findById
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce({
          ...mockAppointment,
          clientName: 'Maria Souza',
        });
      mockAppointmentRepository.update.mockResolvedValue(undefined);

      const result = await service.updateAppointment(mockAppointment.id, {
        clientName: 'Maria Souza',
      });

      expect(result?.clientName).toBe('Maria Souza');
      expect(
        mockCommissionService.assertAppointmentCommissionsEditable,
      ).not.toHaveBeenCalled();
    });

    it('should update completed appointment when commissions are unpaid', async () => {
      const completedAppointment: Appointment = {
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      };

      mockAppointmentRepository.findById
        .mockResolvedValueOnce(completedAppointment)
        .mockResolvedValueOnce({
          ...completedAppointment,
          clientName: 'Maria Souza',
        });
      mockAppointmentRepository.update.mockResolvedValue(undefined);

      const result = await service.updateAppointment(mockAppointment.id, {
        clientName: 'Maria Souza',
      });

      expect(result?.clientName).toBe('Maria Souza');
      expect(
        mockCommissionService.assertAppointmentCommissionsEditable,
      ).toHaveBeenCalledWith(mockAppointment.id);
    });

    it('should reject update when appointment is cancelled', async () => {
      mockAppointmentRepository.findById.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      await expect(
        service.updateAppointment(mockAppointment.id, {
          clientName: 'Maria Souza',
        }),
      ).rejects.toThrow('Cannot update cancelled appointments');
    });
  });
});
