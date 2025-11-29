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

  async findById(id: string): Promise<Commission | null> {
    return await this.findOne({
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
    return await this.find({
      where: { collaboratorId },
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
  ): Promise<Commission | null> {
    return await this.findOne({
      where: { scheduledServiceId },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findByIds(ids: string[]): Promise<Commission[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.find({
      where: { id: In(ids) },
      relations: [
        'collaborator',
        'scheduledService',
        'scheduledService.service',
        'scheduledService.appointment',
      ],
    });
  }

  async findByFilters(filters: {
    paid?: boolean;
    startDate?: Date;
    endDate?: Date;
    collaboratorId?: string;
  }): Promise<Commission[]> {
    const queryBuilder = this.createQueryBuilder('commission')
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

    // Filtro por colaborador
    if (filters.collaboratorId) {
      queryBuilder.andWhere('commission.collaboratorId = :collaboratorId', {
        collaboratorId: filters.collaboratorId,
      });
    }

    return await queryBuilder.getMany();
  }
}
