import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ScheduledService } from '../entities/scheduled-service.entity';

@Injectable()
export class ScheduledServiceRepository extends Repository<ScheduledService> {
  constructor(
    @InjectRepository(ScheduledService)
    repository: Repository<ScheduledService>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string): Promise<ScheduledService | null> {
    return await this.findOne({
      where: { id },
      relations: ['appointment', 'service', 'collaborator'],
    });
  }

  async findByAppointmentId(appointmentId: string): Promise<ScheduledService[]> {
    return await this.find({
      where: { appointmentId },
      relations: ['service', 'collaborator'],
    });
  }

  async findByCollaboratorId(
    collaboratorId: string,
  ): Promise<ScheduledService[]> {
    return await this.find({
      where: { collaboratorId },
      relations: ['appointment', 'service'],
    });
  }
}

