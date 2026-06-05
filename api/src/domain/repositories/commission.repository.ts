import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Commission } from '../entities/commission.entity';

@Injectable()
export class CommissionRepository extends Repository<Commission> {
  constructor(
    @InjectRepository(Commission)
    repository: Repository<Commission>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string, tenantId: string): Promise<Commission | null> {
    return await this.findOne({
      where: { id, tenantId },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findByCollaboratorId(
    collaboratorId: string,
    tenantId: string,
  ): Promise<Commission[]> {
    return await this.find({
      where: { collaboratorId, tenantId },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findByScheduledServiceId(
    scheduledServiceId: string,
    tenantId: string,
  ): Promise<Commission | null> {
    return await this.findOne({
      where: { scheduledServiceId, tenantId },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findManyByIds(ids: string[], tenantId: string): Promise<Commission[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.find({
      where: { id: In(ids), tenantId },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findByFilters(
    tenantId: string,
    filters: {
      paid?: boolean;
      startDate?: Date;
      endDate?: Date;
      collaboratorId?: string;
    },
  ): Promise<Commission[]> {
    const queryBuilder = this.createQueryBuilder('commission')
      .leftJoinAndSelect('commission.collaborator', 'collaborator')
      .leftJoinAndSelect('commission.scheduledService', 'scheduledService')
      .leftJoinAndSelect('scheduledService.service', 'service')
      .leftJoinAndSelect('scheduledService.appointment', 'appointment')
      .where('commission.tenantId = :tenantId', { tenantId });

    if (filters.paid !== undefined) {
      queryBuilder.andWhere('commission.paid = :paid', { paid: filters.paid });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'appointment.date BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    } else if (filters.startDate) {
      queryBuilder.andWhere('appointment.date >= :startDate', {
        startDate: filters.startDate,
      });
    } else if (filters.endDate) {
      queryBuilder.andWhere('appointment.date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.collaboratorId) {
      queryBuilder.andWhere('commission.collaboratorId = :collaboratorId', {
        collaboratorId: filters.collaboratorId,
      });
    }

    queryBuilder
      .orderBy('appointment.date', 'DESC')
      .addOrderBy('appointment.startTime', 'DESC');

    return await queryBuilder.getMany();
  }
}
