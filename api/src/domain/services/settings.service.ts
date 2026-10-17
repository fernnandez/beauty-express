import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { Tenant } from '../entities/tenant.entity';
import { TenantRepository } from '../repositories/tenant.repository';
import { TenantSettingsResponse } from '../types/tenant-settings.types';
import { TenantBranding } from '../types/branding.types';
import { TenantContextService } from './tenant-context.service';
import {
  mergeTenantSettingsForSave,
  normalizeTenantSettings,
} from './tenant-settings.util';

/**
 * Configurações do próprio tenant, para a área operacional.
 * Sempre opera no tenant do usuário autenticado (via TenantContextService),
 * nunca aceitando um tenantId vindo do cliente.
 */
@Injectable({ scope: Scope.REQUEST })
export class SettingsService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async requireTenant(): Promise<Tenant> {
    const tenantId = this.tenantContext.requireTenantId();
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Filial não encontrada');
    }
    return tenant;
  }

  async getSettings(): Promise<TenantSettingsResponse> {
    const tenant = await this.requireTenant();
    return normalizeTenantSettings(tenant.settings, tenant.name);
  }

  async updateSettings(dto: {
    branding?: Partial<TenantBranding>;
    features?: Partial<import('../types/tenant-settings.types').TenantFeatureSettings>;
  }): Promise<TenantSettingsResponse> {
    const tenant = await this.requireTenant();

    const nextSettings = mergeTenantSettingsForSave(
      tenant.settings,
      { branding: dto.branding, features: dto.features },
      tenant.name,
    );

    await this.tenantRepository.update(tenant.id, { settings: nextSettings });

    return normalizeTenantSettings(nextSettings, tenant.name);
  }
}
