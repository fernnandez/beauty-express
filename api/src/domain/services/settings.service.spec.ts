import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TenantRepository } from '../repositories/tenant.repository';
import { TenantContextService } from './tenant-context.service';
import { SettingsService } from './settings.service';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { defaultTenantSettings } from './tenant-settings.util';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockTenant = {
    id: TENANT_ID_MOCK,
    slug: 'paulista',
    name: 'Espaço Bella',
    portalId: 'portal-1',
    settings: defaultTenantSettings('Espaço Bella', {
      branding: {
        displayName: 'Espaço Bella',
        logoUrl: '/demo.svg',
        primaryColor: '#bc5675',
        accentColor: '#fdf2f8',
      },
    }),
    isActive: true,
  };

  const mockTenantRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockTenantContext = {
    requireTenantId: jest.fn().mockReturnValue(TENANT_ID_MOCK),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: TenantRepository, useValue: mockTenantRepository },
        { provide: TenantContextService, useValue: mockTenantContext },
      ],
    }).compile();

    service = await module.resolve<SettingsService>(SettingsService);
    jest.clearAllMocks();
    mockTenantContext.requireTenantId.mockReturnValue(TENANT_ID_MOCK);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return normalized settings for the current tenant', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.getSettings();

      expect(result.branding.displayName).toBe('Espaço Bella');
      expect(result.branding.primaryColor).toBe('#bc5675');
      expect(result.features.commissionsEnabled).toBe(true);
      expect(mockTenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: TENANT_ID_MOCK },
      });
    });

    it('should throw when tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getSettings()).rejects.toThrow(NotFoundException);
    });

    it('should throw when there is no tenant in context', async () => {
      mockTenantContext.requireTenantId.mockImplementation(() => {
        throw new ForbiddenException('Acesso restrito a usuários de filial');
      });

      await expect(service.getSettings()).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateBranding', () => {
    it('should merge only branding and persist, keeping features intact', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.update.mockResolvedValue(undefined);

      const result = await service.updateBranding({
        displayName: 'Novo Nome',
        primaryColor: '#123456',
      });

      // persistiu
      expect(mockTenantRepository.update).toHaveBeenCalledTimes(1);
      const [idArg, updateArg] = mockTenantRepository.update.mock.calls[0];
      expect(idArg).toBe(TENANT_ID_MOCK);
      expect(updateArg.settings.branding.displayName).toBe('Novo Nome');
      expect(updateArg.settings.branding.primaryColor).toBe('#123456');
      // logo não enviado foi preservado
      expect(updateArg.settings.branding.logoUrl).toBe('/demo.svg');
      // features intactas
      expect(updateArg.settings.features.commissionsEnabled).toBe(true);

      // retorno normalizado
      expect(result.branding.displayName).toBe('Novo Nome');
      expect(result.branding.primaryColor).toBe('#123456');
    });

    it('should throw when tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateBranding({ displayName: 'X' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockTenantRepository.update).not.toHaveBeenCalled();
    });
  });
});
