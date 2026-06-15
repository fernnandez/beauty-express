import {
  CreateAppointmentDto,
  ScheduledServiceInputDto,
} from '@application/dtos/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '@application/dtos/appointment/update-appointment.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { Between } from 'typeorm';
import {
  endOfDay,
  isDateBeforeToday,
  parseDateString,
  startOfDay,
} from '../../utils/date.util';
import { validateTimeRange } from '../../common/utils/time.util';
import { normalizeString } from '../../common/utils/string.util';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { CommissionService } from './commission.service';
import { ClientService } from './client.service';
import { ScheduledServiceService } from './scheduled-service.service';
import { AppointmentEditability } from './appointment-editability.types';
import { TenantContextService } from './tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export class AppointmentService {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private scheduledServiceRepository: ScheduledServiceRepository,
    private scheduledServiceService: ScheduledServiceService,
    private commissionService: CommissionService,
    private clientService: ClientService,
    private tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  private validatePastAppointmentServices(
    servicos: ScheduledServiceInputDto[],
  ): void {
    for (const servico of servicos) {
      if (!servico.collaboratorId) {
        throw new BadRequestException(
          'Past appointments require a collaborator assigned to each service',
        );
      }
    }
  }

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
    const isPastDate = isDateBeforeToday(normalizedDate);

    if (isPastDate) {
      this.validatePastAppointmentServices(createDto.servicos);
    }

    const tenantId = this.getTenantId();

    const resolvedClient = await this.clientService.resolveClientForAppointment(
      createDto.clientName,
      createDto.clientPhone,
      createDto.clientId,
    );

    const savedAppointment = await this.appointmentRepository.save({
      tenantId,
      clientName: resolvedClient.clientName,
      clientPhone: resolvedClient.clientPhone,
      clientId: resolvedClient.clientId,
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

    if (isPastDate) {
      return await this.completeAppointment(savedAppointment.id);
    }

    return await this.findById(savedAppointment.id);
  }

  async findAll(): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { tenantId: this.getTenantId() },
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
        tenantId: this.getTenantId(),
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

  async findById(
    id: string,
  ): Promise<(Appointment & { editability?: AppointmentEditability }) | null> {
    const tenantId = this.getTenantId();
    const appointment = await this.appointmentRepository.findById(id, tenantId);
    if (!appointment) {
      return null;
    }

    const editability = await this.commissionService.getAppointmentEditability(
      appointment.id,
      appointment.status,
      appointment.scheduledServices?.map((service) => service.id) ?? [],
    );

    return { ...appointment, editability };
  }

  async updateAppointment(
    appointmentId: string,
    updateDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const tenantId = this.getTenantId();
    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot update cancelled appointments');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      await this.commissionService.assertAppointmentCommissionsEditable(
        appointmentId,
      );
    }

    if (updateDto.startTime || updateDto.endTime) {
      const startTime = updateDto.startTime ?? appointment.startTime;
      const endTime = updateDto.endTime ?? appointment.endTime;
      validateTimeRange(startTime, endTime);
    }

    const updatePayload: Partial<Appointment> = {};

    if (
      updateDto.clientName !== undefined ||
      updateDto.clientPhone !== undefined ||
      updateDto.clientId !== undefined
    ) {
      const resolvedClient = await this.clientService.resolveClientForAppointment(
        updateDto.clientName ?? appointment.clientName,
        updateDto.clientPhone ?? appointment.clientPhone,
        updateDto.clientId ?? appointment.clientId ?? undefined,
      );
      updatePayload.clientName = resolvedClient.clientName;
      updatePayload.clientPhone = resolvedClient.clientPhone;
      updatePayload.clientId = resolvedClient.clientId;
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
      await this.appointmentRepository.update(
        { id: appointmentId, tenantId },
        updatePayload,
      );
    }

    return await this.findById(appointmentId);
  }

  async completeAppointment(appointmentId: string): Promise<Appointment> {
    const tenantId = this.getTenantId();
    const appointment = await this.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(
        appointmentId,
        tenantId,
      );

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
    const tenantId = this.getTenantId();
    const appointment = await this.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed appointments');
    }

    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(
        appointmentId,
        tenantId,
      );

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

  async updateAppointmentStatus(): Promise<void> {
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
