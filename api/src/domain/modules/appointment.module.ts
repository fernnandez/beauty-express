import { AppointmentController } from '@application/controllers/appointment.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../entities/appointment.entity';
import { Collaborator } from '../entities/collaborator.entity';
import { ScheduledService } from '../entities/scheduled-service.entity';
import { Service } from '../entities/service.entity';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { AppointmentService } from '../services/appointment.service';
import { CommissionModule } from './commission.module';
import { ScheduledServiceModule } from './scheduled-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      ScheduledService,
      Service,
      Collaborator,
    ]),
    ScheduledServiceModule,
    CommissionModule,
  ],
  controllers: [AppointmentController],
  providers: [
    AppointmentRepository,
    ScheduledServiceRepository,
    ServiceRepository,
    CollaboratorRepository,
    AppointmentService,
  ],
  exports: [AppointmentRepository, AppointmentService],
})
export class AppointmentModule {}
