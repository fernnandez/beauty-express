import { CreateAppointmentDto } from '@application/dtos/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '@application/dtos/appointment/update-appointment.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between } from 'typeorm';
import { endOfDay, parseDateString, startOfDay } from '../../utils/date.util';
import { validateTimeRange } from '../../common/utils/time.util';
import { normalizeString } from '../../common/utils/string.util';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { CommissionService } from './commission.service';
import { ScheduledServiceService } from './scheduled-service.service';

@Injectable()
export class AppointmentService {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private scheduledServiceRepository: ScheduledServiceRepository,
    private scheduledServiceService: ScheduledServiceService,
    private serviceRepository: ServiceRepository,
    private commissionService: CommissionService,
  ) {}

  async createAppointment(
    createDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    if (!createDto.servicos || createDto.servicos.length === 0) {
      throw new BadRequestException(
        'Appointment must have at least one service',
      );
    }

    validateTimeRange(createDto.startTime, createDto.endTime);

    const normalizedDate = parseDateString(createDto.date);

    const savedAppointment = await this.appointmentRepository.save({
      clientName: createDto.clientName,
      clientPhone: createDto.clientPhone,
      date: normalizedDate,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      status: AppointmentStatus.SCHEDULED,
      observations: normalizeString(createDto.observations),
    });

    for (const servico of createDto.servicos) {
      await this.scheduledServiceService.createScheduledService(
        savedAppointment.id,
        {
          serviceId: servico.serviceId,
          collaboratorId: servico.collaboratorId,
          price: servico.price,
        },
      );
    }

    return await this.findById(savedAppointment.id);
  }

  async findAll(): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      relations: [
        'scheduledServices',
        'scheduledServices.service',
        'scheduledServices.collaborator',
      ],
    });
  }

  async findByDate(date: Date): Promise<Appointment[]> {
    const start = startOfDay(date);
    const end = endOfDay(date);

    return await this.appointmentRepository.find({
      where: {
        date: Between(start, end),
      },
      relations: [
        'scheduledServices',
        'scheduledServices.service',
        'scheduledServices.collaborator',
      ],
      order: {
        startTime: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<Appointment | null> {
    return await this.appointmentRepository.findOne({
      where: { id },
      relations: [
        'scheduledServices',
        'scheduledServices.service',
        'scheduledServices.collaborator',
      ],
    });
  }

  async updateAppointment(
    appointmentId: string,
    updateDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment =
      await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Can only update scheduled appointments');
    }

    if (updateDto.startTime || updateDto.endTime) {
      const startTime = updateDto.startTime ?? appointment.startTime;
      const endTime = updateDto.endTime ?? appointment.endTime;
      validateTimeRange(startTime, endTime);
    }

    const updatePayload: Partial<Appointment> = {};

    if (updateDto.clientName !== undefined) {
      updatePayload.clientName = updateDto.clientName;
    }
    if (updateDto.clientPhone !== undefined) {
      updatePayload.clientPhone = updateDto.clientPhone;
    }
    if (updateDto.date !== undefined) {
      updatePayload.date = parseDateString(updateDto.date);
    }
    if (updateDto.startTime !== undefined) {
      updatePayload.startTime = updateDto.startTime;
    }
    if (updateDto.endTime !== undefined) {
      updatePayload.endTime = updateDto.endTime;
    }
    if (updateDto.observations !== undefined) {
      updatePayload.observations = normalizeString(updateDto.observations);
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.appointmentRepository.update(appointmentId, updatePayload);
    }

    return await this.findById(appointmentId);
  }

  async completeAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(appointmentId);

    if (scheduledServices.length === 0) {
      throw new BadRequestException(
        'Appointment must have at least one scheduled service',
      );
    }

    const nonCancelledServices = scheduledServices.filter(
      (s) => s.status !== 'cancelado',
    );

    if (nonCancelledServices.length === 0) {
      throw new BadRequestException(
        'Appointment must have at least one non-cancelled service',
      );
    }

    const allHaveCollaborator = nonCancelledServices.every(
      (s) => s.collaboratorId !== null && s.collaboratorId !== undefined,
    );

    if (!allHaveCollaborator) {
      throw new BadRequestException(
        'All scheduled services must have a collaborator assigned before completing the appointment',
      );
    }

    for (const service of nonCancelledServices) {
      if (service.status === 'pendente') {
        await this.scheduledServiceService.completeScheduledService(service.id);
      }
    }

    appointment.status = AppointmentStatus.COMPLETED;
    const savedAppointment = await this.appointmentRepository.save(appointment);

    await this.commissionService.calculateCommissionsForAppointment(
      savedAppointment.id,
    );

    return savedAppointment;
  }

  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed appointments');
    }

    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(appointmentId);

    const nonCancelledServices = scheduledServices.filter(
      (s) => s.status !== 'cancelado',
    );

    for (const scheduledService of nonCancelledServices) {
      await this.scheduledServiceService.cancelScheduledService(
        scheduledService.id,
      );
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return await this.appointmentRepository.save(appointment);
  }

  async getAppointmentTotalPrice(appointmentId: string): Promise<number> {
    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(appointmentId);

    return scheduledServices
      .filter((scheduledService) => scheduledService.status !== 'cancelado')
      .reduce(
        (total, scheduledService) => total + Number(scheduledService.price),
        0,
      );
  }

  async updateAppointmentStatus(): Promise<void> {
    // Business rule: update appointment status based on scheduled services
    const appointments = await this.findAll();

    for (const appointment of appointments) {
      if (appointment.status === AppointmentStatus.CANCELLED) {
        continue;
      }

      const scheduledServices = appointment.scheduledServices || [];

      if (scheduledServices.length === 0) {
        continue;
      }

      const allCompleted = scheduledServices.every(
        (s) => s.status === 'concluido' || s.status === 'cancelado',
      );

      if (allCompleted && appointment.status !== AppointmentStatus.COMPLETED) {
        appointment.status = AppointmentStatus.COMPLETED;
        await this.appointmentRepository.save(appointment);
      }
    }
  }
}
