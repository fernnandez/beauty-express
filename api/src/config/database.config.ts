import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { Service } from '@domain/entities/service.entity';
import { Appointment } from '@domain/entities/appointment.entity';
import { Commission } from '@domain/entities/commission.entity';
import { ScheduledService } from '@domain/entities/scheduled-service.entity';
import { Tenant } from '@domain/entities/tenant.entity';
import { User } from '@domain/entities/user.entity';
import { AdminAuditLog } from '@domain/entities/admin-audit-log.entity';
import { RefreshToken } from '@domain/entities/refresh-token.entity';
import { DataSourceOptions } from 'typeorm';

const entities = [
  Tenant,
  User,
  RefreshToken,
  AdminAuditLog,
  Collaborator,
  Service,
  Appointment,
  Commission,
  ScheduledService,
];

const isProduction = process.env.NODE_ENV === 'production';

export const getDatabaseConfig = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'beauty_express',
  entities,
  synchronize:
    process.env.DB_SYNCHRONIZE === 'true' ||
    (process.env.DB_SYNCHRONIZE !== 'false' && !isProduction),
  logging: process.env.DB_LOGGING === 'true',
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
});

export const databaseConfig = (): TypeOrmModuleOptions => getDatabaseConfig();
