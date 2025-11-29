import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { Service } from '@domain/entities/service.entity';
import { Appointment } from '@domain/entities/appointment.entity';
import { Commission } from '@domain/entities/commission.entity';
import { ScheduledService } from '@domain/entities/scheduled-service.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'sqlite',
  database: process.env.DB_DATABASE || 'database.sqlite',
  entities: [Collaborator, Service, Appointment, Commission, ScheduledService],
  synchronize: true,
  logging: false,
});
