import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    );
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    const percentage = collaborator.commissionPercentage;
    const amount = (Number(scheduledService.price) * percentage) / 100;

    const existingCommission =
      await this.commissionRepository.findByScheduledServiceId(
        scheduledServiceId,
      );
    if (existingCommission) {
      await this.commissionRepository.update(existingCommission.id, {
        amount,
        percentage,
      });
      return await this.commissionRepository.findById(existingCommission.id);
    }

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

    // Usa QueryBuilder para ordenação correta por relação aninhada
    return await this.commissionRepository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.collaborator', 'collaborator')
      .leftJoinAndSelect('commission.scheduledService', 'scheduledService')
      .leftJoinAndSelect('scheduledService.service', 'service')
      .leftJoinAndSelect('scheduledService.appointment', 'appointment')
      .orderBy('appointment.date', 'DESC')
      .addOrderBy('appointment.startTime', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Commission | null> {
    return await this.commissionRepository.findById(id);
  }

  async findByCollaboratorId(collaboratorId: string): Promise<Commission[]> {
    return await this.commissionRepository.findByCollaboratorId(collaboratorId);
  }

  async findPending(): Promise<Commission[]> {
    // Usa QueryBuilder para ordenação correta por relação aninhada
    return await this.commissionRepository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.collaborator', 'collaborator')
      .leftJoinAndSelect('commission.scheduledService', 'scheduledService')
      .leftJoinAndSelect('scheduledService.service', 'service')
      .leftJoinAndSelect('scheduledService.appointment', 'appointment')
      .where('commission.paid = :paid', { paid: false })
      .orderBy('appointment.date', 'DESC')
      .addOrderBy('appointment.startTime', 'DESC')
      .getMany();
  }

  async markAsPaid(commissionIds: string[]): Promise<Commission[]> {
    const commissions =
      await this.commissionRepository.findByIds(commissionIds);

    if (commissions.length !== commissionIds.length) {
      throw new NotFoundException('Some commissions were not found');
    }

    await this.commissionRepository.update(
      { id: In(commissionIds) },
      { paid: true },
    );

    return await this.commissionRepository.findByIds(commissionIds);
  }

  async markAsUnpaid(commissionIds: string[]): Promise<Commission[]> {
    const commissions =
      await this.commissionRepository.findByIds(commissionIds);

    if (commissions.length !== commissionIds.length) {
      throw new NotFoundException('Some commissions were not found');
    }

    await this.commissionRepository.update(
      { id: In(commissionIds) },
      { paid: false },
    );

    return await this.commissionRepository.findByIds(commissionIds);
  }
}
