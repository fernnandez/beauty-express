import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from '../entities/commission.entity';
import { ScheduledService } from '../entities/scheduled-service.entity';
import { Collaborator } from '../entities/collaborator.entity';
import { Service } from '../entities/service.entity';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { CommissionService } from '../services/commission.service';
import { CommissionController } from '@application/controllers/commission.controller';
import { ScheduledServiceModule } from './scheduled-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Commission,
      ScheduledService,
      Collaborator,
      Service,
    ]),
    ScheduledServiceModule,
  ],
  controllers: [CommissionController],
  providers: [
    CommissionRepository,
    ScheduledServiceRepository,
    CollaboratorRepository,
    ServiceRepository,
    CommissionService,
  ],
  exports: [CommissionRepository, CommissionService],
})
export class CommissionModule {}
