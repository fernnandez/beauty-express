import { CreateAppointmentDto } from '@application/dtos/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '@application/dtos/appointment/update-appointment.dto';
import { Injectable } from '@nestjs/common';
import { Between } from 'typeorm';
import {
  endOfDay,
  parseDateString,
  startOfDay,
} from '../../common/utils/date.util';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { ScheduledServiceService } from './scheduled-service.service';

@Injectable()
export class AppointmentService {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private scheduledServiceRepository: ScheduledServiceRepository,
    private scheduledServiceService: ScheduledServiceService,
    private serviceRepository: ServiceRepository,
  ) {}

  async createAppointment(
    createDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    // Business rule: must have at least one service
    if (!createDto.servicos || createDto.servicos.length === 0) {
      throw new Error('Appointment must have at least one service');
    }

    // Business rule: validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (
      !timeRegex.test(createDto.startTime) ||
      !timeRegex.test(createDto.endTime)
    ) {
      throw new Error('Invalid time format. Use HH:MM format');
    }

    // Business rule: inicio must be before fim
    const [startTimeHour, startTimeMin] = createDto.startTime
      .split(':')
      .map(Number);
    const [endTimeHour, endTimeMin] = createDto.endTime.split(':').map(Number);
    const startTimeMinutes = startTimeHour * 60 + startTimeMin;
    const endTimeMinutes = endTimeHour * 60 + endTimeMin;

    if (startTimeMinutes >= endTimeMinutes) {
      throw new Error('Start time must be before end time');
    }

    // Garante que a data seja às 00:00:00 no timezone America/Sao_Paulo
    const normalizedDate = parseDateString(createDto.date);

    // Trata observações: se for string vazia ou undefined, converte para null
    const observations =
      createDto.observations && createDto.observations.trim()
        ? createDto.observations.trim()
        : null;

    // Create appointment using spread operator
    const savedAppointment = await this.appointmentRepository.save({
      clientName: createDto.clientName,
      clientPhone: createDto.clientPhone,
      date: normalizedDate,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      status: AppointmentStatus.SCHEDULED,
      observations: observations,
    });

    // Create scheduled services
    for (const servico of createDto.servicos) {
      // Business rule: service must exist
      const service = await this.serviceRepository.findById(servico.serviceId);
      if (!service) {
        throw new Error(`Service ${servico.serviceId} not found`);
      }

      // Create scheduled service
      await this.scheduledServiceService.createScheduledService(
        savedAppointment.id,
        {
          serviceId: servico.serviceId,
          collaboratorId: servico.collaboratorId,
          price: servico.price,
        },
      );
    }

    // Return appointment with scheduled services
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
    // Usa funções utilitárias para garantir timezone correto
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
      throw new Error('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Can only update scheduled appointments');
    }

    // Business rule: validate time format if provided
    if (updateDto.startTime || updateDto.endTime) {
      const startTime = updateDto.startTime ?? appointment.startTime;
      const endTime = updateDto.endTime ?? appointment.endTime;

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new Error('Invalid time format. Use HH:MM format');
      }

      // Business rule: inicio must be before fim
      const [startTimeHour, startTimeMin] = startTime.split(':').map(Number);
      const [endTimeHour, endTimeMin] = endTime.split(':').map(Number);
      const startTimeMinutes = startTimeHour * 60 + startTimeMin;
      const endTimeMinutes = endTimeHour * 60 + endTimeMin;

      if (startTimeMinutes >= endTimeMinutes) {
        throw new Error('Start time must be before end time');
      }
    }

    // Prepare update payload
    const updatePayload: Partial<Appointment> = {};

    if (updateDto.clientName !== undefined) {
      updatePayload.clientName = updateDto.clientName;
    }
    if (updateDto.clientPhone !== undefined) {
      updatePayload.clientPhone = updateDto.clientPhone;
    }
    if (updateDto.date !== undefined) {
      // Garante que a data seja às 00:00:00 no timezone America/Sao_Paulo
      updatePayload.date = parseDateString(updateDto.date);
    }
    if (updateDto.startTime !== undefined) {
      updatePayload.startTime = updateDto.startTime;
    }
    if (updateDto.endTime !== undefined) {
      updatePayload.endTime = updateDto.endTime;
    }
    if (updateDto.observations !== undefined) {
      console.log(updateDto.observations);
      // Trata observações: se for string vazia, converte para null
      updatePayload.observations =
        updateDto.observations && updateDto.observations.trim()
          ? updateDto.observations.trim()
          : null;
    }

    // Update appointment using repository.update
    if (Object.keys(updatePayload).length > 0) {
      await this.appointmentRepository.update(appointmentId, updatePayload);
    }

    // Update scheduled services if provided
    if (updateDto.services !== undefined) {
      // Get existing scheduled services
      const existingServices =
        await this.scheduledServiceRepository.findByAppointmentId(
          appointmentId,
        );

      // Remove existing services that are not in the new list
      for (const existing of existingServices) {
        if (existing.status !== 'pendente') {
          continue; // Don't remove non-pending services
        }
        const stillExists = updateDto.services.some(
          (s) => s.serviceId === existing.serviceId,
        );
        if (!stillExists) {
          await this.scheduledServiceService.cancelScheduledService(
            existing.id,
          );
        }
      }

      // Add or update services
      for (const service of updateDto.services) {
        const existing = existingServices.find(
          (s) => s.serviceId === service.serviceId && s.status === 'pendente',
        );

        if (existing) {
          // Update existing - sempre atualiza preço quando fornecido
          const updatePayload: {
            collaboratorId?: string;
            price?: number;
          } = {};

          if (service.collaboratorId !== undefined) {
            updatePayload.collaboratorId = service.collaboratorId;
          }

          // Sempre atualiza o preço quando fornecido (frontend sempre envia um preço)
          if (service.price !== undefined && service.price !== null) {
            updatePayload.price = Number(service.price);
          }

          // Sempre atualiza se houver preço ou colaborador para atualizar
          if (Object.keys(updatePayload).length > 0) {
            await this.scheduledServiceService.updateScheduledService(
              existing.id,
              updatePayload,
            );
          } else if (service.price !== undefined && service.price !== null) {
            // Força atualização do preço mesmo se não houver outros campos
            await this.scheduledServiceService.updateScheduledService(
              existing.id,
              { price: Number(service.price) },
            );
          }
        } else {
          // Create new
          await this.scheduledServiceService.createScheduledService(
            appointmentId,
            {
              serviceId: service.serviceId,
              collaboratorId: service.collaboratorId,
              price: service.price,
            },
          );
        }
      }
    }

    return await this.findById(appointmentId);
  }

  async completeAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Business rule: check if all scheduled services are completed AND have collaborator
    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(appointmentId);

    if (scheduledServices.length === 0) {
      throw new Error('Appointment must have at least one scheduled service');
    }

    const allCompleted = scheduledServices.every(
      (s) => s.status === 'concluido' || s.status === 'cancelado',
    );

    if (!allCompleted) {
      throw new Error(
        'All scheduled services must be completed before completing the appointment',
      );
    }

    // Business rule: all non-cancelled services must have collaborator
    const nonCancelledServices = scheduledServices.filter(
      (s) => s.status !== 'cancelado',
    );

    const allHaveCollaborator = nonCancelledServices.every(
      (s) => s.collaboratorId !== null && s.collaboratorId !== undefined,
    );

    if (!allHaveCollaborator) {
      throw new Error(
        'All scheduled services must have a collaborator assigned before completing the appointment',
      );
    }

    appointment.status = AppointmentStatus.COMPLETED;
    return await this.appointmentRepository.save(appointment);
  }

  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot cancel completed appointments');
    }

    // Cancel all pending/started scheduled services
    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(appointmentId);

    for (const scheduledService of scheduledServices) {
      if (scheduledService.status === 'pendente') {
        await this.scheduledServiceService.cancelScheduledService(
          scheduledService.id,
        );
      }
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return await this.appointmentRepository.save(appointment);
  }

  async getAppointmentTotalPrice(appointmentId: string): Promise<number> {
    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(appointmentId);

    // Soma os preços reais dos serviços agendados (não o preço padrão)
    return scheduledServices.reduce(
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
