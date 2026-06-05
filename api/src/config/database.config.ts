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

export const entities = [
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
const isCompiled = __filename.endsWith('.js');

const migrationsGlob = isCompiled
  ? __dirname + '/../migrations/*.js'
  : __dirname + '/../migrations/*.{ts,js}';

const resolveSsl = (databaseUrl?: string) => {
  if (process.env.DB_SSL === 'false') {
    return undefined;
  }

  if (
    process.env.DB_SSL === 'true' ||
    databaseUrl?.includes('sslmode=require') ||
    databaseUrl?.includes('railway.app')
  ) {
    return { rejectUnauthorized: false };
  }

  return undefined;
};

const sharedConfig = (): Pick<
  DataSourceOptions,
  'entities' | 'migrations' | 'migrationsRun' | 'synchronize' | 'logging' | 'ssl'
> => ({
  entities,
  migrations: [migrationsGlob],
  migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
  synchronize:
    process.env.DB_SYNCHRONIZE === 'true' ||
    (process.env.DB_SYNCHRONIZE !== 'false' && !isProduction),
  logging: process.env.DB_LOGGING === 'true',
  ssl: resolveSsl(),
});

export const getDatabaseConfig = (): DataSourceOptions => {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ...sharedConfig(),
      ssl: resolveSsl(databaseUrl),
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'beauty_express',
    ...sharedConfig(),
  };
};

export const databaseConfig = (): TypeOrmModuleOptions => getDatabaseConfig();
