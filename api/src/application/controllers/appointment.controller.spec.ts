import {
  Appointment,
  AppointmentStatus,
} from '@domain/entities/appointment.entity';
import { AppointmentService } from '@domain/services/appointment.service';
import { Test, TestingModule } from '@nestjs/testing';
import { parseDateString } from '../../utils/date.util';
import { CreateAppointmentDto } from '../dtos/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dtos/appointment/update-appointment.dto';
import { AppointmentController } from './appointment.controller';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let service: AppointmentService;

  const mockAppointment: Appointment = {
    id: 'appointment-1',
    clientName: 'João Silva',
    clientPhone: '11999999999',
    date: parseDateString('2024-12-28'),
    startTime: '09:00',
    endTime: '11:00',
    status: AppointmentStatus.SCHEDULED,
    observations: null,
    scheduledServices: [],
  };

  const mockAppointmentService = {
    createAppointment: jest.fn(),
    findAll: jest.fn(),
    findByDate: jest.fn(),
    findById: jest.fn(),
    updateAppointment: jest.fn(),
    completeAppointment: jest.fn(),
    cancelAppointment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        {
          provide: AppointmentService,
          useValue: mockAppointmentService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentController>(AppointmentController);
    service = module.get<AppointmentService>(AppointmentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
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

    it('should create an appointment', async () => {
      mockAppointmentService.createAppointment.mockResolvedValue(
        mockAppointment,
      );

      const result = await controller.create(createDto);

      expect(result).toEqual(mockAppointment);
      expect(service.createAppointment).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    const mockAppointments: Appointment[] = [mockAppointment];

    it('should return appointments for today when no date query', async () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      mockAppointmentService.findByDate.mockResolvedValue(mockAppointments);

      const result = await controller.findAll();

      expect(result).toEqual(mockAppointments);
      expect(service.findByDate).toHaveBeenCalledWith(parseDateString(todayString));
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should return appointments by date when date query is provided', async () => {
      const date = '2024-12-28';
      mockAppointmentService.findByDate.mockResolvedValue(mockAppointments);

      const result = await controller.findAll(date);

      expect(result).toEqual(mockAppointments);
      expect(service.findByDate).toHaveBeenCalledWith(parseDateString(date));
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should throw error when date format is invalid', async () => {
      const invalidDate = '2024/12/28';

      await expect(controller.findAll(invalidDate)).rejects.toThrow(
        'Invalid date format. Expected yyyy-mm-dd',
      );

      expect(service.findByDate).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an appointment by id', async () => {
      mockAppointmentService.findById.mockResolvedValue(mockAppointment);

      const result = await controller.findOne(mockAppointment.id);

      expect(result).toEqual(mockAppointment);
      expect(service.findById).toHaveBeenCalledWith(mockAppointment.id);
    });

    it('should return null when appointment not found', async () => {
      mockAppointmentService.findById.mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto: UpdateAppointmentDto = {
      clientName: 'Maria Santos',
      clientPhone: '11888888888',
    };

    const updatedAppointment: Appointment = {
      ...mockAppointment,
      clientName: updateDto.clientName || mockAppointment.clientName,
      clientPhone: updateDto.clientPhone || mockAppointment.clientPhone,
    };

    it('should update an appointment', async () => {
      mockAppointmentService.updateAppointment.mockResolvedValue(
        updatedAppointment,
      );

      const result = await controller.update(mockAppointment.id, updateDto);

      expect(result).toEqual(updatedAppointment);
      expect(service.updateAppointment).toHaveBeenCalledWith(
        mockAppointment.id,
        updateDto,
      );
    });
  });

  describe('complete', () => {
    const completedAppointment: Appointment = {
      ...mockAppointment,
      status: AppointmentStatus.COMPLETED,
    };

    it('should complete an appointment', async () => {
      mockAppointmentService.completeAppointment.mockResolvedValue(
        completedAppointment,
      );

      const result = await controller.complete(mockAppointment.id);

      expect(result).toEqual(completedAppointment);
      expect(service.completeAppointment).toHaveBeenCalledWith(
        mockAppointment.id,
      );
    });
  });

  describe('cancel', () => {
    const cancelledAppointment: Appointment = {
      ...mockAppointment,
      status: AppointmentStatus.CANCELLED,
    };

    it('should cancel an appointment', async () => {
      mockAppointmentService.cancelAppointment.mockResolvedValue(
        cancelledAppointment,
      );

      const result = await controller.cancel(mockAppointment.id);

      expect(result).toEqual(cancelledAppointment);
      expect(service.cancelAppointment).toHaveBeenCalledWith(
        mockAppointment.id,
      );
    });
  });
});
