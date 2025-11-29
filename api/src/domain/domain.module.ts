import { Module } from '@nestjs/common';
import { AppointmentModule } from './modules/appointment.module';
import { CollaboratorModule } from './modules/collaborator.module';
import { CommissionModule } from './modules/commission.module';
import { ServiceModule } from './modules/service.module';
import { ScheduledServiceModule } from './modules/scheduled-service.module';
import { FinancialReportModule } from './modules/financial-report.module';

@Module({
  imports: [
    AppointmentModule,
    CollaboratorModule,
    CommissionModule,
    ServiceModule,
    ScheduledServiceModule,
    FinancialReportModule,
  ],
  exports: [
    AppointmentModule,
    CollaboratorModule,
    CommissionModule,
    ServiceModule,
    ScheduledServiceModule,
    FinancialReportModule,
  ],
})
export class DomainModule {}
