import { AdminAuditLog } from '@domain/entities/admin-audit-log.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface CreateAdminAuditLogInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

@Injectable()
export class AdminAuditLogRepository {
  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly repository: Repository<AdminAuditLog>,
  ) {}

  async save(input: CreateAdminAuditLogInput): Promise<AdminAuditLog> {
    return await this.repository.save(input);
  }

  async findRecent(limit = 50): Promise<AdminAuditLog[]> {
    return await this.repository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
