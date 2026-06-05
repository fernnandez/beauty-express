import { AdminAuditLogRepository } from '@domain/repositories/admin-audit-log.repository';
import { Injectable } from '@nestjs/common';

export interface AdminAuditContext {
  actorUserId: string;
  ipAddress?: string | null;
}

@Injectable()
export class AdminAuditService {
  constructor(
    private readonly auditLogRepository: AdminAuditLogRepository,
  ) {}

  async log(
    context: AdminAuditContext,
    action: string,
    entityType: string,
    entityId?: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<void> {
    await this.auditLogRepository.save({
      actorUserId: context.actorUserId,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
      ipAddress: context.ipAddress ?? null,
    });
  }

  async listRecent(limit = 50) {
    return await this.auditLogRepository.findRecent(limit);
  }
}
