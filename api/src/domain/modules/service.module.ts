import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../entities/service.entity';
import { ScheduledService } from '../entities/scheduled-service.entity';
import { ServiceRepository } from '../repositories/service.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceService } from '../services/service.service';
import { ServiceController } from '@application/controllers/service.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Service, ScheduledService])],
  controllers: [ServiceController],
  providers: [ServiceRepository, ScheduledServiceRepository, ServiceService],
  exports: [ServiceRepository, ServiceService],
})
export class ServiceModule {}
