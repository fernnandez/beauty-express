import { CreateScheduledServiceDto } from '@application/dtos/scheduled-service/create-scheduled-service.dto';
import { UpdateScheduledServiceDto } from '@application/dtos/scheduled-service/update-scheduled-service.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { AppointmentStatus } from '../entities/appointment.entity';
import { Commission } from '../entities/commission.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { TenantContextService } from './tenant-context.service';
import { TenantSettingsService } from './tenant-settings.service';

@Injectable({ scope: Scope.REQUEST })
export class ScheduledServiceService {
  constructor(
    private scheduledServiceRepository: ScheduledServiceRepository,
    private serviceRepository: ServiceRepository,
    private collaboratorRepository: CollaboratorRepository,
    private commissionRepository: CommissionRepository,
    private appointmentRepository: AppointmentRepository,
    private tenantContext: TenantContextService,
    private tenantSettingsService: TenantSettingsService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  private async validateCollaboratorActive(
    collaboratorId: string,
  ): Promise<void> {
    const tenantId = this.getTenantId();
    const collaborator = await this.collaboratorRepository.findById(
      collaboratorId,
      tenantId,
    );
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }
    if (!collaborator.isActive) {
      throw new BadRequestException('Collaborator is not active');
    }
  }

  private async assertCommissionNotPaid(
    scheduledServiceId: string,
  ): Promise<void> {
    const tenantId = this.getTenantId();
    const commission = await this.commissionRepository.findByScheduledServiceId(
      scheduledServiceId,
      tenantId,
    );

    if (commission?.paid) {
      throw new BadRequestException(
        'Cannot modify scheduled service with paid commission',
      );
    }
  }

  private async assertScheduledServiceEditable(
    scheduledService: ScheduledService,
  ): Promise<void> {
    if (scheduledService.status === ScheduledServiceStatus.PENDING) {
      return;
    }

    if (scheduledService.status === ScheduledServiceStatus.COMPLETED) {
      await this.assertCommissionNotPaid(scheduledService.id);
      return;
    }

    throw new BadRequestException(
      'Cannot modify cancelled scheduled services',
    );
  }

  private async syncCommissionForCompletedService(
    scheduledService: ScheduledService,
  ): Promise<Commission | null> {
    if (scheduledService.status !== ScheduledServiceStatus.COMPLETED) {
      return null;
    }

    const tenantId = this.getTenantId();

    if (!(await this.tenantSettingsService.areCommissionsEnabled(tenantId))) {
      return null;
    }

    if (!scheduledService.collaboratorId) {
      throw new BadRequestException(
        'Completed scheduled service must have a collaborator assigned',
      );
    }

    await this.assertCommissionNotPaid(scheduledService.id);

    const collaborator = await this.collaboratorRepository.findById(
      scheduledService.collaboratorId,
      tenantId,
    );
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    const percentage = collaborator.commissionPercentage;
    const amount = (Number(scheduledService.price) * percentage) / 100;
    const existingCommission =
      await this.commissionRepository.findByScheduledServiceId(
        scheduledService.id,
        tenantId,
      );

    if (existingCommission) {
      await this.commissionRepository.update(
        { id: existingCommission.id, tenantId },
        {
          amount,
          percentage,
          collaboratorId: scheduledService.collaboratorId,
        },
      );
      return await this.commissionRepository.findById(
        existingCommission.id,
        tenantId,
      );
    }

    return await this.commissionRepository.save({
      tenantId,
      collaboratorId: scheduledService.collaboratorId,
      scheduledServiceId: scheduledService.id,
      amount,
      percentage,
      paid: false,
    });
  }

  async createScheduledService(
    appointmentId: string,
    createDto: CreateScheduledServiceDto,
  ): Promise<ScheduledService> {
    const tenantId = this.getTenantId();
    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot add services to cancelled appointments',
      );
    }

    const service = await this.serviceRepository.findById(
      createDto.serviceId,
      tenantId,
    );
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (createDto.collaboratorId) {
      await this.validateCollaboratorActive(createDto.collaboratorId);
    }

    const isCompletedAppointment =
      appointment.status === AppointmentStatus.COMPLETED;

    if (isCompletedAppointment && !createDto.collaboratorId) {
      throw new BadRequestException(
        'Collaborator is required when adding services to completed appointments',
      );
    }

    const savedService = await this.scheduledServiceRepository.save({
      appointmentId,
      tenantId,
      serviceId: createDto.serviceId,
      collaboratorId: createDto.collaboratorId,
      price: createDto.price ?? service.defaultPrice,
      status: isCompletedAppointment
        ? ScheduledServiceStatus.COMPLETED
        : ScheduledServiceStatus.PENDING,
    });

    if (isCompletedAppointment) {
      await this.syncCommissionForCompletedService(savedService);
    }

    return await this.scheduledServiceRepository.findById(
      savedService.id,
      tenantId,
    );
  }

  async findByAppointmentId(
    appointmentId: string,
  ): Promise<ScheduledService[]> {
    return await this.scheduledServiceRepository.findByAppointmentId(
      appointmentId,
      this.getTenantId(),
    );
  }

  async updateScheduledService(
    id: string,
    updateDto: UpdateScheduledServiceDto,
  ): Promise<ScheduledService> {
    const tenantId = this.getTenantId();
    const scheduledService = await this.scheduledServiceRepository.findById(
      id,
      tenantId,
    );
    if (!scheduledService) {
      throw new NotFoundException('ScheduledService not found');
    }

    await this.assertScheduledServiceEditable(scheduledService);

    if (updateDto.serviceId) {
      const service = await this.serviceRepository.findById(
        updateDto.serviceId,
        tenantId,
      );
      if (!service) {
        throw new NotFoundException('Service not found');
      }
      if (updateDto.price === undefined) {
        updateDto.price = service.defaultPrice;
      }
    }

    if (updateDto.collaboratorId !== undefined && updateDto.collaboratorId) {
      await this.validateCollaboratorActive(updateDto.collaboratorId);
    }

    const updatePayload: Partial<ScheduledService> = {};

    if (updateDto.serviceId !== undefined) {
      updatePayload.serviceId = updateDto.serviceId;
    }
    if (updateDto.collaboratorId !== undefined) {
      updatePayload.collaboratorId = updateDto.collaboratorId || null;
    }
    if (updateDto.price !== undefined) {
      updatePayload.price = updateDto.price;
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.scheduledServiceRepository.update(
        { id, tenantId },
        updatePayload,
      );
    }

    const updatedService = await this.scheduledServiceRepository.findById(
      id,
      tenantId,
    );

    if (
      updatedService?.status === ScheduledServiceStatus.COMPLETED &&
      Object.keys(updatePayload).length > 0
    ) {
      await this.syncCommissionForCompletedService(updatedService);
    }

    return updatedService;
  }

  async completeScheduledService(id: string): Promise<ScheduledService> {
    const tenantId = this.getTenantId();
    const scheduledService = await this.scheduledServiceRepository.findById(
      id,
      tenantId,
    );
    if (!scheduledService) {
      throw new NotFoundException('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.PENDING) {
      throw new BadRequestException(
        'Can only complete pending scheduled services',
      );
    }

    if (!scheduledService.collaboratorId) {
      throw new BadRequestException(
        'ScheduledService must have a collaborator assigned to be completed',
      );
    }

    scheduledService.status = ScheduledServiceStatus.COMPLETED;
    const savedService =
      await this.scheduledServiceRepository.save(scheduledService);

    await this.syncCommissionForCompletedService(savedService);

    return savedService;
  }

  async reopenScheduledService(id: string): Promise<ScheduledService> {
    const tenantId = this.getTenantId();
    const scheduledService = await this.scheduledServiceRepository.findById(
      id,
      tenantId,
    );
    if (!scheduledService) {
      throw new NotFoundException('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.COMPLETED) {
      throw new BadRequestException(
        'Can only reopen completed scheduled services',
      );
    }

    await this.assertCommissionNotPaid(scheduledService.id);

    scheduledService.status = ScheduledServiceStatus.PENDING;
    const savedService =
      await this.scheduledServiceRepository.save(scheduledService);

    const commission = await this.commissionRepository.findByScheduledServiceId(
      id,
      tenantId,
    );
    if (commission && !commission.paid) {
      await this.commissionRepository.delete({ id: commission.id, tenantId });
    }

    return savedService;
  }

  async cancelScheduledService(id: string): Promise<ScheduledService> {
    const tenantId = this.getTenantId();
    const scheduledService = await this.scheduledServiceRepository.findById(
      id,
      tenantId,
    );
    if (!scheduledService) {
      throw new NotFoundException('ScheduledService not found');
    }

    if (scheduledService.status === ScheduledServiceStatus.CANCELLED) {
      return scheduledService;
    }

    if (scheduledService.status === ScheduledServiceStatus.COMPLETED) {
      await this.assertCommissionNotPaid(scheduledService.id);
    }

    scheduledService.status = ScheduledServiceStatus.CANCELLED;
    const savedService =
      await this.scheduledServiceRepository.save(scheduledService);

    if (savedService.status === ScheduledServiceStatus.CANCELLED) {
      const commission = await this.commissionRepository.findByScheduledServiceId(
        id,
        tenantId,
      );
      if (commission && !commission.paid) {
        await this.commissionRepository.delete({ id: commission.id, tenantId });
      }
    }

    return savedService;
  }
}
