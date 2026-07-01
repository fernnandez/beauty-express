import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { In } from 'typeorm';
import { Commission } from '../entities/commission.entity';
import { ScheduledServiceStatus } from '../entities/scheduled-service.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { TenantContextService } from './tenant-context.service';
import { TenantSettingsService } from './tenant-settings.service';
import {
  AppointmentEditability,
  ScheduledServiceEditability,
} from './appointment-editability.types';
import { AppointmentStatus } from '../entities/appointment.entity';
import {
  CommissionFilterParams,
  CommissionListResult,
} from '../repositories/commission-list.types';

@Injectable({ scope: Scope.REQUEST })
export class CommissionService {
  constructor(
    private commissionRepository: CommissionRepository,
    private scheduledServiceRepository: ScheduledServiceRepository,
    private collaboratorRepository: CollaboratorRepository,
    private tenantContext: TenantContextService,
    private tenantSettingsService: TenantSettingsService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  async calculateCommission(
    scheduledServiceId: string,
  ): Promise<Commission | null> {
    const tenantId = this.getTenantId();

    if (!(await this.tenantSettingsService.areCommissionsEnabled(tenantId))) {
      return null;
    }

    const scheduledService = await this.scheduledServiceRepository.findById(
      scheduledServiceId,
      tenantId,
    );
    if (!scheduledService) {
      throw new NotFoundException('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.COMPLETED) {
      throw new BadRequestException(
        'Can only calculate commission for completed scheduled services',
      );
    }

    if (!scheduledService.collaboratorId) {
      throw new BadRequestException(
        'ScheduledService has no assigned collaborator',
      );
    }

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
        scheduledServiceId,
        tenantId,
      );
    if (existingCommission) {
      if (existingCommission.paid) {
        throw new BadRequestException(
          'Cannot recalculate commission that is already paid',
        );
      }
      await this.commissionRepository.update(
        { id: existingCommission.id, tenantId },
        { amount, percentage },
      );
      return await this.commissionRepository.findById(
        existingCommission.id,
        tenantId,
      );
    }

    return await this.commissionRepository.save({
      tenantId,
      collaboratorId: scheduledService.collaboratorId,
      scheduledServiceId,
      amount,
      percentage,
      paid: false,
    });
  }

  async calculateCommissionsForAppointment(
    appointmentId: string,
  ): Promise<Commission[]> {
    const tenantId = this.getTenantId();
    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(
        appointmentId,
        tenantId,
      );

    const commissions: Commission[] = [];

    for (const scheduledService of scheduledServices) {
      if (scheduledService.status === ScheduledServiceStatus.COMPLETED) {
        const commission = await this.calculateCommission(scheduledService.id);
        if (commission) {
          commissions.push(commission);
        }
      }
    }

    return commissions;
  }

  async findAll(
    filters?: CommissionFilterParams,
    page = 1,
    limit = 50,
  ): Promise<CommissionListResult> {
    const tenantId = this.getTenantId();

    return await this.commissionRepository.findPaginated(
      tenantId,
      filters ?? {},
      page,
      limit,
    );
  }

  private async markCommissionsStatus(
    commissionIds: string[],
    paid: boolean,
  ): Promise<Commission[]> {
    const tenantId = this.getTenantId();
    const commissions = await this.commissionRepository.findManyByIds(
      commissionIds,
      tenantId,
    );

    if (commissions.length !== commissionIds.length) {
      throw new NotFoundException('Some commissions were not found');
    }

    await this.commissionRepository.update(
      { id: In(commissionIds), tenantId },
      { paid },
    );

    return await this.commissionRepository.findManyByIds(
      commissionIds,
      tenantId,
    );
  }

  async markAsPaid(commissionIds: string[]): Promise<Commission[]> {
    return this.markCommissionsStatus(commissionIds, true);
  }

  async markAsUnpaid(commissionIds: string[]): Promise<Commission[]> {
    return this.markCommissionsStatus(commissionIds, false);
  }

  async assertScheduledServiceCommissionEditable(
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

  async assertAppointmentCommissionsEditable(
    appointmentId: string,
  ): Promise<void> {
    const tenantId = this.getTenantId();
    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(
        appointmentId,
        tenantId,
      );

    for (const scheduledService of scheduledServices) {
      if (scheduledService.status === ScheduledServiceStatus.CANCELLED) {
        continue;
      }

      await this.assertScheduledServiceCommissionEditable(scheduledService.id);
    }
  }

  async removeUnpaidCommissionForScheduledService(
    scheduledServiceId: string,
  ): Promise<void> {
    const tenantId = this.getTenantId();
    const commission = await this.commissionRepository.findByScheduledServiceId(
      scheduledServiceId,
      tenantId,
    );

    if (commission && !commission.paid) {
      await this.commissionRepository.delete({ id: commission.id, tenantId });
    }
  }

  async getAppointmentEditability(
    appointmentId: string,
    appointmentStatus: AppointmentStatus,
    scheduledServiceIds: string[],
  ): Promise<AppointmentEditability> {
    const tenantId = this.getTenantId();
    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(
        appointmentId,
        tenantId,
      );

    const services: Record<string, ScheduledServiceEditability> = {};
    let hasPaidCommission = false;

    for (const scheduledService of scheduledServices) {
      if (!scheduledServiceIds.includes(scheduledService.id)) {
        continue;
      }

      if (scheduledService.status === ScheduledServiceStatus.CANCELLED) {
        services[scheduledService.id] = {
          canEdit: false,
          commissionPaid: false,
        };
        continue;
      }

      const commission = await this.commissionRepository.findByScheduledServiceId(
        scheduledService.id,
        tenantId,
      );
      const commissionPaid = commission?.paid ?? false;

      if (commissionPaid) {
        hasPaidCommission = true;
      }

      const canEdit =
        (appointmentStatus === AppointmentStatus.SCHEDULED &&
          scheduledService.status === ScheduledServiceStatus.PENDING) ||
        (appointmentStatus === AppointmentStatus.COMPLETED &&
          scheduledService.status === ScheduledServiceStatus.COMPLETED &&
          !commissionPaid);

      services[scheduledService.id] = { canEdit, commissionPaid };
    }

    const canEditAppointment =
      appointmentStatus === AppointmentStatus.SCHEDULED ||
      (appointmentStatus === AppointmentStatus.COMPLETED &&
        !hasPaidCommission);

    const canReopenAppointment =
      appointmentStatus === AppointmentStatus.COMPLETED && !hasPaidCommission;

    return { canEditAppointment, canReopenAppointment, services };
  }
}
