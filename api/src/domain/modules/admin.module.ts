import { AdminController } from '@application/controllers/admin.controller';
import { AdminAuditLog } from '@domain/entities/admin-audit-log.entity';
import { Appointment } from '@domain/entities/appointment.entity';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { Service } from '@domain/entities/service.entity';
import { Tenant } from '@domain/entities/tenant.entity';
import { User } from '@domain/entities/user.entity';
import { AdminAuditLogRepository } from '@domain/repositories/admin-audit-log.repository';
import { TenantRepository } from '@domain/repositories/tenant.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { AdminAuditService } from '@domain/services/admin-audit.service';
import { AdminService } from '@domain/services/admin.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Tenant,
      User,
      Collaborator,
      Service,
      Appointment,
      AdminAuditLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminAuditService,
    AdminAuditLogRepository,
    TenantRepository,
    UserRepository,
  ],
})
export class AdminModule {}
