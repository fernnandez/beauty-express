import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledService } from '../entities/scheduled-service.entity';
import { Service } from '../entities/service.entity';
import { Collaborator } from '../entities/collaborator.entity';
import { Commission } from '../entities/commission.entity';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceService } from '../services/scheduled-service.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduledService, Service, Collaborator, Commission]),
  ],
  providers: [
    ScheduledServiceRepository,
    ServiceRepository,
    CollaboratorRepository,
    CommissionRepository,
    ScheduledServiceService,
  ],
  exports: [ScheduledServiceRepository, ScheduledServiceService],
})
export class ScheduledServiceModule {}

