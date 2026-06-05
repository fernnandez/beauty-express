import { AccessTokenPayload } from './auth.types';
import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UserRole } from '@domain/entities/user-role.enum';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(
    @Inject(REQUEST) private readonly request: { user?: AccessTokenPayload },
  ) {}

  getUserId(): string | null {
    return this.request.user?.sub ?? null;
  }

  getRole(): UserRole | null {
    return this.request.user?.role ?? null;
  }

  getTenantId(): string | null {
    return this.request.user?.tenantId ?? null;
  }

  requireTenantId(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Acesso restrito a usuários de filial');
    }
    return tenantId;
  }

  isSuperAdmin(): boolean {
    return this.request.user?.role === UserRole.SUPER_ADMIN;
  }
}
