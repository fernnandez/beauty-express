import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { Service } from '@domain/entities/service.entity';
import { Appointment } from '@domain/entities/appointment.entity';
import { Commission } from '@domain/entities/commission.entity';
import { ScheduledService } from '@domain/entities/scheduled-service.entity';

export const databaseConfig = (): TypeOrmModuleOptions => {
  // Se DATABASE_URL estiver definido, usa PostgreSQL (produção no Render)
  // Caso contrário, usa SQLite (desenvolvimento local)
  const isProduction = process.env.NODE_ENV === 'production';
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  if (hasDatabaseUrl || (isProduction && !process.env.DB_DATABASE)) {
    // Configuração PostgreSQL para produção
    const databaseUrl = process.env.DATABASE_URL;

    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: isProduction
        ? {
            rejectUnauthorized: false,
          }
        : false,
      entities: [
        Collaborator,
        Service,
        Appointment,
        Commission,
        ScheduledService,
      ],
      synchronize: true, // Em produção, considere usar migrations
      logging: process.env.DB_LOGGING === 'true',
    };
  }

  // Configuração SQLite para desenvolvimento
  return {
    type: 'sqlite',
    database: process.env.DB_DATABASE || 'database.sqlite',
    entities: [
      Collaborator,
      Service,
      Appointment,
      Commission,
      ScheduledService,
    ],
    synchronize: true,
    logging: false,
  };
};
