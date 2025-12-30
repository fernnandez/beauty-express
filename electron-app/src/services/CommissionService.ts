import { Repository, In } from 'typeorm';
import { getDataSource } from '../database/database';
import { Commission } from '../entities/Commission';
import { ScheduledService, ScheduledServiceStatus } from '../entities/ScheduledService';
import { Collaborator } from '../entities/Collaborator';

export interface CommissionFilters {
  paid?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  collaboratorId?: string;
}

export class CommissionService {
  private repository: Repository<Commission>;
  private scheduledServiceRepository: Repository<ScheduledService>;
  private collaboratorRepository: Repository<Collaborator>;

  constructor() {
    this.repository = getDataSource().getRepository(Commission);
    this.scheduledServiceRepository = getDataSource().getRepository(ScheduledService);
    this.collaboratorRepository = getDataSource().getRepository(Collaborator);
  }

  async calculateCommission(scheduledServiceId: string): Promise<Commission> {
    const scheduledService = await this.scheduledServiceRepository.findOne({
      where: { id: scheduledServiceId },
      relations: ['service', 'collaborator'],
    });
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

    const collaborator = await this.collaboratorRepository.findOne({
      where: { id: scheduledService.collaboratorId },
    });
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    // Business rule: calculate commission based on percentage
    const percentage = collaborator.commissionPercentage;
    // Calculate commission based on scheduled service price
    const amount = (Number(scheduledService.price) * percentage) / 100;

    // Check if commission already exists
    const existingCommission = await this.repository.findOne({
      where: { scheduledServiceId },
    });
    if (existingCommission) {
      // Update existing commission using repository.update
      await this.repository.update(existingCommission.id, {
        amount,
        percentage,
      });
      return await this.findById(existingCommission.id)!;
    }

    // Create new commission using spread operator
    return await this.repository.save({
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
    const scheduledServices = await this.scheduledServiceRepository.find({
      where: { appointmentId },
      relations: ['service', 'collaborator'],
    });

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
          const existing = await this.repository.findOne({
            where: { scheduledServiceId: scheduledService.id },
          });
          if (existing) {
            commissions.push(existing);
          }
        }
      }
    }

    return commissions;
  }

  async findAll(filters?: CommissionFilters): Promise<Commission[]> {
    if (
      filters &&
      (filters.paid !== undefined ||
        filters.startDate ||
        filters.endDate ||
        filters.collaboratorId)
    ) {
      return await this.findByFilters(filters);
    }

    return await this.repository.find({
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findById(id: string): Promise<Commission | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findByCollaboratorId(collaboratorId: string): Promise<Commission[]> {
    return await this.repository.find({
      where: { collaboratorId },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findPending(): Promise<Commission[]> {
    return await this.repository.find({
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
    const commissions = await this.findByIds(commissionIds);

    if (commissions.length !== commissionIds.length) {
      throw new Error('Some commissions were not found');
    }

    // Update all commissions using repository.update with In()
    await this.repository.update(
      { id: In(commissionIds) },
      { paid: true },
    );

    // Return updated commissions
    return await this.findByIds(commissionIds);
  }

  async markAsUnpaid(commissionIds: string[]): Promise<Commission[]> {
    const commissions = await this.findByIds(commissionIds);

    if (commissions.length !== commissionIds.length) {
      throw new Error('Some commissions were not found');
    }

    // Update all commissions using repository.update with In()
    await this.repository.update(
      { id: In(commissionIds) },
      { paid: false },
    );

    // Return updated commissions
    return await this.findByIds(commissionIds);
  }

  private async findByIds(ids: string[]): Promise<Commission[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.repository.find({
      where: { id: In(ids) },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  private async findByFilters(filters: CommissionFilters): Promise<Commission[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.collaborator', 'collaborator')
      .leftJoinAndSelect('commission.scheduledService', 'scheduledService')
      .leftJoinAndSelect('scheduledService.service', 'service')
      .leftJoinAndSelect('scheduledService.appointment', 'appointment');

    // Filtro por status (paid)
    if (filters.paid !== undefined) {
      queryBuilder.andWhere('commission.paid = :paid', { paid: filters.paid });
    }

    // Filtro por range de data (data do agendamento)
    if (filters.startDate && filters.endDate) {
      const startDate = filters.startDate instanceof Date ? filters.startDate : new Date(filters.startDate);
      const endDate = filters.endDate instanceof Date ? filters.endDate : new Date(filters.endDate);
      queryBuilder.andWhere(
        'appointment.date BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    } else if (filters.startDate) {
      const startDate = filters.startDate instanceof Date ? filters.startDate : new Date(filters.startDate);
      queryBuilder.andWhere('appointment.date >= :startDate', {
        startDate,
      });
    } else if (filters.endDate) {
      const endDate = filters.endDate instanceof Date ? filters.endDate : new Date(filters.endDate);
      queryBuilder.andWhere('appointment.date <= :endDate', {
        endDate,
      });
    }

    // Filtro por colaborador
    if (filters.collaboratorId) {
      queryBuilder.andWhere('commission.collaboratorId = :collaboratorId', {
        collaboratorId: filters.collaboratorId,
      });
    }

    return await queryBuilder
      .orderBy('appointment.date', 'DESC')
      .addOrderBy('commission.createdAt', 'DESC')
      .getMany();
  }
}
