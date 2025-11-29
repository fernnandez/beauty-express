import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Commission } from '../entities/commission.entity';
import { ScheduledServiceStatus } from '../entities/scheduled-service.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';

@Injectable()
export class CommissionService {
  constructor(
    private commissionRepository: CommissionRepository,
    private scheduledServiceRepository: ScheduledServiceRepository,
    private collaboratorRepository: CollaboratorRepository,
  ) {}

  async calculateCommission(scheduledServiceId: string): Promise<Commission> {
    const scheduledService =
      await this.scheduledServiceRepository.findById(scheduledServiceId);
    if (!scheduledService) {
      throw new Error('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.COMPLETED) {
      throw new Error(
        'Can only calculate commission for completed scheduled services',
      );
    }

    if (!scheduledService.collaboratorId) {
      throw new Error('ScheduledService has no assigned collaborator');
    }

    const collaborator = await this.collaboratorRepository.findById(
      scheduledService.collaboratorId,
    );
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    // Business rule: calculate commission based on percentage
    const percentage = collaborator.commissionPercentage;
    // Calculate commission based on scheduled service price
    const amount = (Number(scheduledService.price) * percentage) / 100;

    // Check if commission already exists
    const existingCommission =
      await this.commissionRepository.findByScheduledServiceId(
        scheduledServiceId,
      );
    if (existingCommission) {
      // Update existing commission using repository.update
      await this.commissionRepository.update(existingCommission.id, {
        amount,
        percentage,
      });
      return await this.commissionRepository.findById(existingCommission.id);
    }

    // Create new commission using spread operator
    return await this.commissionRepository.save({
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
    const scheduledServices =
      await this.scheduledServiceRepository.findByAppointmentId(appointmentId);

    const commissions: Commission[] = [];

    for (const scheduledService of scheduledServices) {
      if (scheduledService.status === ScheduledServiceStatus.COMPLETED) {
        try {
          const commission = await this.calculateCommission(
            scheduledService.id,
          );
          commissions.push(commission);
        } catch (error) {
          // Skip if commission already exists or other error
          const existing =
            await this.commissionRepository.findByScheduledServiceId(
              scheduledService.id,
            );
          if (existing) {
            commissions.push(existing);
          }
        }
      }
    }

    return commissions;
  }

  async findAll(filters?: {
    paid?: boolean;
    startDate?: Date;
    endDate?: Date;
    collaboratorId?: string;
  }): Promise<Commission[]> {
    if (
      filters &&
      (filters.paid !== undefined ||
        filters.startDate ||
        filters.endDate ||
        filters.collaboratorId)
    ) {
      return await this.commissionRepository.findByFilters(filters);
    }

    return await this.commissionRepository.find({
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findById(id: string): Promise<Commission | null> {
    return await this.commissionRepository.findById(id);
  }

  async findByCollaboratorId(collaboratorId: string): Promise<Commission[]> {
    return await this.commissionRepository.findByCollaboratorId(collaboratorId);
  }

  async findPending(): Promise<Commission[]> {
    return await this.commissionRepository.find({
      where: { paid: false },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async markAsPaid(commissionIds: string[]): Promise<Commission[]> {
    const commissions =
      await this.commissionRepository.findByIds(commissionIds);

    if (commissions.length !== commissionIds.length) {
      throw new Error('Some commissions were not found');
    }

    // Update all commissions using repository.update with In()
    await this.commissionRepository.update(
      { id: In(commissionIds) },
      { paid: true },
    );

    // Return updated commissions
    return await this.commissionRepository.findByIds(commissionIds);
  }

  async markAsUnpaid(commissionIds: string[]): Promise<Commission[]> {
    const commissions =
      await this.commissionRepository.findByIds(commissionIds);

    if (commissions.length !== commissionIds.length) {
      throw new Error('Some commissions were not found');
    }

    // Update all commissions using repository.update with In()
    await this.commissionRepository.update(
      { id: In(commissionIds) },
      { paid: false },
    );

    // Return updated commissions
    return await this.commissionRepository.findByIds(commissionIds);
  }
}
