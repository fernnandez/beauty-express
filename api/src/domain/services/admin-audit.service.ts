import { AdminAuditLogRepository } from '@domain/repositories/admin-audit-log.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';

export interface AdminAuditContext {
  actorUserId: string;
  ipAddress?: string | null;
}

@Injectable()
export class AdminAuditService {
  constructor(
    private readonly auditLogRepository: AdminAuditLogRepository,
    private readonly userRepository: UserRepository,
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

  /** Lista as ações recentes, incluindo o e-mail do ator (resolvido em lote). */
  async listRecent(limit = 50) {
    const logs = await this.auditLogRepository.findRecent(limit);

    const actorIds = [...new Set(logs.map((l) => l.actorUserId))];
    const actors = actorIds.length
      ? await this.userRepository.find({
          where: { id: In(actorIds) },
          select: { id: true, email: true },
        })
      : [];
    const emailById = new Map(actors.map((a) => [a.id, a.email]));

    return logs.map((log) => ({
      ...log,
      actorEmail: emailById.get(log.actorUserId) ?? null,
    }));
  }
}
