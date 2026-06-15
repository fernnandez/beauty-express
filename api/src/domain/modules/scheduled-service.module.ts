import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../entities/appointment.entity';
import { ScheduledService } from '../entities/scheduled-service.entity';
import { Service } from '../entities/service.entity';
import { Collaborator } from '../entities/collaborator.entity';
import { Commission } from '../entities/commission.entity';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceService } from '../services/scheduled-service.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Appointment,
      ScheduledService,
      Service,
      Collaborator,
      Commission,
    ]),
  ],
  providers: [
    AppointmentRepository,
    ScheduledServiceRepository,
    ServiceRepository,
    CollaboratorRepository,
    CommissionRepository,
    ScheduledServiceService,
  ],
  exports: [ScheduledServiceRepository, ScheduledServiceService],
})
export class ScheduledServiceModule {}

