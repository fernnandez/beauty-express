import { Module } from '@nestjs/common';
import { AdminModule } from './modules/admin.module';
import { AppointmentModule } from './modules/appointment.module';
import { AuthModule } from './modules/auth.module';
import { CollaboratorModule } from './modules/collaborator.module';
import { ClientModule } from './modules/client.module';
import { CommissionModule } from './modules/commission.module';
import { ServiceModule } from './modules/service.module';
import { ScheduledServiceModule } from './modules/scheduled-service.module';
import { FinancialReportModule } from './modules/financial-report.module';
import { PortalModule } from './modules/portal.module';
import { SettingsModule } from './modules/settings.module';

@Module({
  imports: [
    AuthModule,
    PortalModule,
    AdminModule,
    AppointmentModule,
    CollaboratorModule,
    ClientModule,
    CommissionModule,
    ServiceModule,
    ScheduledServiceModule,
    FinancialReportModule,
    SettingsModule,
  ],
  exports: [
    AuthModule,
    PortalModule,
    AppointmentModule,
    CollaboratorModule,
    ClientModule,
    CommissionModule,
    ServiceModule,
    ScheduledServiceModule,
    FinancialReportModule,
    SettingsModule,
  ],
})
export class DomainModule {}
