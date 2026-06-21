import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { TenantRepository } from '../repositories/tenant.repository';
import { normalizeTenantSettings } from './tenant-settings.util';
import { TenantContextService } from './tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export class TenantSettingsService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async areCommissionsEnabled(tenantId?: string): Promise<boolean> {
    const id = tenantId ?? this.tenantContext.requireTenantId();
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return normalizeTenantSettings(tenant.settings, tenant.name).features
      .commissionsEnabled;
  }
}
