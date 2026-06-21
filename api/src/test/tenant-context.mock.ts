import { TenantContextService } from '@domain/services/tenant-context.service';
import { TenantSettingsService } from '@domain/services/tenant-settings.service';

export const TENANT_ID_MOCK = 'c1000001-0001-4000-8000-000000000001';

export const mockTenantContextService: Pick<
  TenantContextService,
  'requireTenantId' | 'getTenantId' | 'getUserId' | 'getRole' | 'isSuperAdmin'
> = {
  requireTenantId: jest.fn().mockReturnValue(TENANT_ID_MOCK),
  getTenantId: jest.fn().mockReturnValue(TENANT_ID_MOCK),
  getUserId: jest.fn().mockReturnValue('d1000001-0001-4000-8000-000000000002'),
  getRole: jest.fn(),
  isSuperAdmin: jest.fn().mockReturnValue(false),
};

export const mockTenantSettingsService: Pick<
  TenantSettingsService,
  'areCommissionsEnabled'
> = {
  areCommissionsEnabled: jest.fn().mockResolvedValue(true),
};
