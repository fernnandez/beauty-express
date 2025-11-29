import { DomainModule } from '@domain/domain.module';
import { Module } from '@nestjs/common';
import { AppointmentController } from './controllers/appointment.controller';
import { CollaboratorController } from './controllers/collaborator.controller';
import { CommissionController } from './controllers/commission.controller';
import { ServiceController } from './controllers/service.controller';
import { ScheduledServiceController } from './controllers/scheduled-service.controller';
import { FinancialReportController } from './controllers/financial-report.controller';

@Module({
  controllers: [
    AppointmentController,
    CollaboratorController,
    CommissionController,
    ServiceController,
    ScheduledServiceController,
    FinancialReportController,
  ],
  imports: [DomainModule],
})
export class ApplicationModule {}
