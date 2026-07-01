import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Commission } from '../entities/commission.entity';
import {
  CommissionFilterParams,
  CommissionListResult,
} from './commission-list.types';

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

  async findPaginated(
    tenantId: string,
    filters: CommissionFilterParams,
    page: number,
    limit: number,
  ): Promise<CommissionListResult> {
    const total = await this.createFilteredQueryBuilder(
      tenantId,
      filters,
      false,
    ).getCount();

    const summaryRaw = await this.createFilteredQueryBuilder(
      tenantId,
      filters,
      false,
    )
      .select('COALESCE(SUM(commission.amount), 0)', 'totalAmount')
      .addSelect(
        'COALESCE(SUM(CASE WHEN commission.paid = false THEN commission.amount ELSE 0 END), 0)',
        'pendingAmount',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN commission.paid = true THEN commission.amount ELSE 0 END), 0)',
        'paidAmount',
      )
      .getRawOne<{
        totalAmount: string;
        pendingAmount: string;
        paidAmount: string;
      }>();

    const itemsQueryBuilder = this.createFilteredQueryBuilder(
      tenantId,
      filters,
      true,
    )
      .orderBy('appointment.date', 'DESC')
      .addOrderBy('appointment.startTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const items = await itemsQueryBuilder.getMany();

    return {
      items,
      total,
      page,
      limit,
      summary: {
        totalAmount: Number(summaryRaw?.totalAmount ?? 0),
        pendingAmount: Number(summaryRaw?.pendingAmount ?? 0),
        paidAmount: Number(summaryRaw?.paidAmount ?? 0),
      },
    };
  }

  private createFilteredQueryBuilder(
    tenantId: string,
    filters: CommissionFilterParams,
    withSelects: boolean,
  ): SelectQueryBuilder<Commission> {
    const queryBuilder = this.createQueryBuilder('commission');

    if (withSelects) {
      queryBuilder
        .leftJoinAndSelect('commission.collaborator', 'collaborator')
        .leftJoinAndSelect('commission.scheduledService', 'scheduledService')
        .leftJoinAndSelect('scheduledService.service', 'service')
        .leftJoinAndSelect('scheduledService.appointment', 'appointment');
    } else {
      queryBuilder
        .leftJoin('commission.collaborator', 'collaborator')
        .leftJoin('commission.scheduledService', 'scheduledService')
        .leftJoin('scheduledService.service', 'service')
        .leftJoin('scheduledService.appointment', 'appointment');
    }

    queryBuilder.where('commission.tenantId = :tenantId', { tenantId });
    this.applyFilters(queryBuilder, filters);

    return queryBuilder;
  }

  async findByFilters(
    tenantId: string,
    filters: CommissionFilterParams,
  ): Promise<Commission[]> {
    return await this.createFilteredQueryBuilder(tenantId, filters, true)
      .orderBy('appointment.date', 'DESC')
      .addOrderBy('appointment.startTime', 'DESC')
      .getMany();
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Commission>,
    filters: CommissionFilterParams,
  ): void {
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

    if (filters.collaboratorIds?.length) {
      queryBuilder.andWhere(
        'commission.collaboratorId IN (:...collaboratorIds)',
        {
          collaboratorIds: filters.collaboratorIds,
        },
      );
    }

    if (filters.search) {
      queryBuilder.andWhere(
        `(LOWER(collaborator.name) LIKE :search OR LOWER(service.name) LIKE :search OR LOWER(appointment.clientName) LIKE :search)`,
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }
  }
}
