import { CreateScheduledServiceDto } from '@application/dtos/scheduled-service/create-scheduled-service.dto';
import { UpdateScheduledServiceDto } from '@application/dtos/scheduled-service/update-scheduled-service.dto';
import {
  BadRequestException,
  ForbiddenException,
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
import { calcCommissionAmount } from './commission-calc.util';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

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
    @InjectDataSource() private dataSource: DataSource,
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

    throw new BadRequestException('Cannot modify cancelled scheduled services');
  }

  private async syncCommissionForCompletedService(
    scheduledService: ScheduledService,
    manager?: EntityManager,
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

    // Repositórios ligados à transação quando houver manager; caso contrário,
    // os repositórios padrão (não transacionais).
    const commissionRepo = manager
      ? manager.withRepository(this.commissionRepository)
      : this.commissionRepository;
    const serviceRepo = manager
      ? manager.withRepository(this.serviceRepository)
      : this.serviceRepository;

    await this.assertCommissionNotPaid(scheduledService.id);

    const service = await serviceRepo.findById(
      scheduledService.serviceId,
      tenantId,
    );
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const percentage = Number(service.commissionPercentage ?? 0);
    const amount = calcCommissionAmount(
      scheduledService.price,
      service.commissionPercentage,
    );
    const existingCommission = await commissionRepo.findByScheduledServiceId(
      scheduledService.id,
      tenantId,
    );

    if (existingCommission) {
      await commissionRepo.update(
        { id: existingCommission.id, tenantId },
        {
          amount,
          percentage,
          collaboratorId: scheduledService.collaboratorId,
        },
      );
      return await commissionRepo.findById(existingCommission.id, tenantId);
    }

    return await commissionRepo.save({
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

    const created = await this.scheduledServiceRepository.findById(
      savedService.id,
      tenantId,
    );
    if (!created) {
      throw new NotFoundException('ScheduledService not found');
    }
    return created;
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

    if (updateDto.collaboratorId !== undefined && updateDto.collaboratorId) {
      await this.validateCollaboratorActive(updateDto.collaboratorId);
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
    if (!updatedService) {
      throw new NotFoundException('ScheduledService not found');
    }

    if (
      updatedService?.status === ScheduledServiceStatus.COMPLETED &&
      Object.keys(updatePayload).length > 0
    ) {
      await this.syncCommissionForCompletedService(updatedService);
    }

    return updatedService;
  }

  async completeScheduledService(
    id: string,
    scopedCollaboratorId?: string | null,
  ): Promise<ScheduledService> {
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

    // Colaborador só pode concluir o próprio serviço.
    if (
      scopedCollaboratorId &&
      scheduledService.collaboratorId !== scopedCollaboratorId
    ) {
      throw new ForbiddenException(
        'You can only complete services assigned to you',
      );
    }

    scheduledService.status = ScheduledServiceStatus.COMPLETED;

    // Conclusão + comissão + fechamento do agendamento precisam ser atômicos:
    // se qualquer passo falhar, nada é persistido (evita serviço concluído sem
    // comissão ou agendamento meio-fechado).
    const savedService = await this.dataSource.transaction(async (manager) => {
      const ssRepo = manager.withRepository(this.scheduledServiceRepository);
      const saved = await ssRepo.save(scheduledService);

      await this.syncCommissionForCompletedService(saved, manager);
      await this.completeAppointmentIfAllServicesDone(
        scheduledService.appointmentId,
        tenantId,
        manager,
      );
      return saved;
    });

    return savedService;
  }

  /**
   * Conclui o agendamento se não restar nenhum serviço pendente
   * (considerando apenas os não cancelados). Idempotente.
   */
  private async completeAppointmentIfAllServicesDone(
    appointmentId: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const appointmentRepo = manager
      ? manager.withRepository(this.appointmentRepository)
      : this.appointmentRepository;
    const ssRepo = manager
      ? manager.withRepository(this.scheduledServiceRepository)
      : this.scheduledServiceRepository;

    const appointment = await appointmentRepo.findById(appointmentId, tenantId);
    if (!appointment || appointment.status !== AppointmentStatus.SCHEDULED) {
      return;
    }

    const services = await ssRepo.findByAppointmentId(appointmentId, tenantId);
    const nonCancelled = services.filter(
      (s) => s.status !== ScheduledServiceStatus.CANCELLED,
    );
    const hasPending = nonCancelled.some(
      (s) => s.status === ScheduledServiceStatus.PENDING,
    );

    if (nonCancelled.length > 0 && !hasPending) {
      appointment.status = AppointmentStatus.COMPLETED;
      await appointmentRepo.save(appointment);
    }
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
      const commission =
        await this.commissionRepository.findByScheduledServiceId(id, tenantId);
      if (commission && !commission.paid) {
        await this.commissionRepository.delete({ id: commission.id, tenantId });
      }
    }

    return savedService;
  }
}
