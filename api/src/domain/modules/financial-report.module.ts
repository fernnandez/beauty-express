import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledService } from '../entities/scheduled-service.entity';
import { Commission } from '../entities/commission.entity';
import { Appointment } from '../entities/appointment.entity';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { FinancialReportService } from '../services/financial-report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduledService, Commission, Appointment]),
  ],
  providers: [
    ScheduledServiceRepository,
    CommissionRepository,
    FinancialReportService,
  ],
  exports: [FinancialReportService],
})
export class FinancialReportModule {}

