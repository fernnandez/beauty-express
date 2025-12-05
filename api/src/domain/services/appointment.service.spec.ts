import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { ScheduledServiceService } from './scheduled-service.service';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '@application/dtos/appointment/create-appointment.dto';
import { Service } from '../entities/service.entity';
import { ScheduledService, ScheduledServiceStatus } from '../entities/scheduled-service.entity';
import { parseDateString } from '../../utils/date.util';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let scheduledServiceRepository: jest.Mocked<ScheduledServiceRepository>;
  let serviceRepository: jest.Mocked<ServiceRepository>;
  let scheduledServiceService: jest.Mocked<ScheduledServiceService>;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
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
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    appointmentRepository = module.get(AppointmentRepository);
    scheduledServiceRepository = module.get(ScheduledServiceRepository);
    serviceRepository = module.get(ServiceRepository);
    scheduledServiceService = module.get(ScheduledServiceService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAppointment', () => {
    const mockService: Service = {
      id: 'service-1',
      name: 'Corte de Cabelo',
      defaultPrice: 50.0,
      description: 'Corte profissional',
      collaborators: [],
    };

    const createDto: CreateAppointmentDto = {
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: '2024-12-28',
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
          appointmentId: savedAppointment.id,
          serviceId: 'service-1',
          price: 50.0,
          status: ScheduledServiceStatus.PENDING,
        } as ScheduledService,
      ],
    };

    it('should create appointment with valid data', async () => {
      mockAppointmentRepository.save.mockResolvedValue(savedAppointment);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockScheduledServiceService.createScheduledService.mockResolvedValue(
        appointmentWithServices.scheduledServices[0],
      );
      mockAppointmentRepository.findOne.mockResolvedValue(appointmentWithServices);

      const result = await service.createAppointment(createDto);

      expect(result).toEqual(appointmentWithServices);
      expect(mockAppointmentRepository.save).toHaveBeenCalled();
      expect(mockServiceRepository.findById).toHaveBeenCalledWith('service-1');
      expect(mockScheduledServiceService.createScheduledService).toHaveBeenCalled();
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
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(service.createAppointment(createDto)).rejects.toThrow(
        'Service service-1 not found',
      );

      expect(mockAppointmentRepository.save).toHaveBeenCalled();
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
      mockAppointmentRepository.findOne.mockResolvedValue(appointmentWithServices);

      await service.createAppointment(dtoWithCustomPrice);

      expect(mockScheduledServiceService.createScheduledService).toHaveBeenCalledWith(
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
      mockAppointmentRepository.findOne.mockResolvedValue(appointmentWithServices);

      await service.createAppointment(dtoWithCollaborator);

      expect(mockScheduledServiceService.createScheduledService).toHaveBeenCalledWith(
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
      mockAppointmentRepository.findOne.mockResolvedValue(appointmentWithServices);

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
      mockAppointmentRepository.findOne.mockResolvedValue(appointmentWithServices);

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
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: new Date('2024-12-28'),
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
      scheduledServices: [],
    };

    it('should return appointment when found', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findById(mockAppointment.id);

      expect(result).toEqual(mockAppointment);
      expect(mockAppointmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockAppointment.id },
        relations: [
          'scheduledServices',
          'scheduledServices.service',
          'scheduledServices.collaborator',
        ],
      });
    });

    it('should return null when appointment not found', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('completeAppointment', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        collaboratorId: 'collaborator-1',
        price: 50.0,
        status: ScheduledServiceStatus.COMPLETED,
      } as ScheduledService,
    ];

    const mockAppointment: Appointment = {
      id: 'appointment-1',
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: new Date('2024-12-28'),
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
      scheduledServices: mockScheduledServices,
    };

    it('should complete appointment when all services are completed and have collaborators', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment);
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        mockScheduledServices,
      );
      mockAppointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });

      const result = await service.completeAppointment(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(mockAppointmentRepository.save).toHaveBeenCalled();
    });

    it('should throw error when appointment not found', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.completeAppointment('non-existent-id')).rejects.toThrow(
        'Appointment not found',
      );
    });

    it('should throw error when not all services are completed', async () => {
      const incompleteServices: ScheduledService[] = [
        {
          ...mockScheduledServices[0],
          status: ScheduledServiceStatus.PENDING,
        } as ScheduledService,
      ];

      mockAppointmentRepository.findOne.mockResolvedValue({
        ...mockAppointment,
        scheduledServices: incompleteServices,
      });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        incompleteServices,
      );

      await expect(service.completeAppointment(mockAppointment.id)).rejects.toThrow(
        'All scheduled services must be completed before completing the appointment',
      );
    });

    it('should throw error when services do not have collaborators', async () => {
      const servicesWithoutCollaborator: ScheduledService[] = [
        {
          ...mockScheduledServices[0],
          collaboratorId: undefined,
        } as ScheduledService,
      ];

      mockAppointmentRepository.findOne.mockResolvedValue({
        ...mockAppointment,
        scheduledServices: servicesWithoutCollaborator,
      });
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        servicesWithoutCollaborator,
      );

      await expect(service.completeAppointment(mockAppointment.id)).rejects.toThrow(
        'All scheduled services must have a collaborator assigned before completing the appointment',
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
          appointmentId: 'appointment-1',
          serviceId: 'service-2',
          collaboratorId: 'collaborator-2',
          price: 30.0,
          status: ScheduledServiceStatus.CANCELLED,
        } as ScheduledService,
      ];

      mockAppointmentRepository.findOne.mockResolvedValue({
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

      const result = await service.completeAppointment(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
    });
  });

  describe('cancelAppointment', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        price: 50.0,
        status: ScheduledServiceStatus.PENDING,
      } as ScheduledService,
    ];

    const mockAppointment: Appointment = {
      id: 'appointment-1',
      clientName: 'João Silva',
      clientPhone: '11999999999',
      date: new Date('2024-12-28'),
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
      scheduledServices: mockScheduledServices,
    };

    it('should cancel appointment', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment);
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
      expect(mockScheduledServiceService.cancelScheduledService).toHaveBeenCalled();
    });

    it('should throw error when appointment not found', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelAppointment('non-existent-id')).rejects.toThrow(
        'Appointment not found',
      );
    });

    it('should throw error when trying to cancel completed appointment', async () => {
      const completedAppointment: Appointment = {
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      };

      mockAppointmentRepository.findOne.mockResolvedValue(completedAppointment);

      await expect(service.cancelAppointment(mockAppointment.id)).rejects.toThrow(
        'Cannot cancel completed appointments',
      );
    });
  });

  describe('getAppointmentTotalPrice', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        price: 50.0,
        status: ScheduledServiceStatus.PENDING,
      } as ScheduledService,
      {
        id: 'scheduled-2',
        appointmentId: 'appointment-1',
        serviceId: 'service-2',
        price: 30.0,
        status: ScheduledServiceStatus.PENDING,
      } as ScheduledService,
    ];

    it('should calculate total price correctly', async () => {
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        mockScheduledServices,
      );

      const result = await service.getAppointmentTotalPrice('appointment-1');

      expect(result).toBe(80.0);
    });

    it('should return 0 when no services', async () => {
      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue([]);

      const result = await service.getAppointmentTotalPrice('appointment-1');

      expect(result).toBe(0);
    });
  });
});

