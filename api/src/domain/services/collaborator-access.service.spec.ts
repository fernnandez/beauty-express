import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CollaboratorAccessService } from './collaborator-access.service';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { UserRepository } from '../repositories/user.repository';
import { TenantContextService } from './tenant-context.service';
import {
  TENANT_ID_MOCK,
  mockTenantContextService,
} from '../../test/tenant-context.mock';
import { UserRole } from '../entities/user-role.enum';

describe('CollaboratorAccessService', () => {
  let service: CollaboratorAccessService;

  const collaboratorId = 'collab-1';

  const mockCollaboratorRepository = {
    findById: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    findByEmailAndTenant: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaboratorAccessService,
        { provide: CollaboratorRepository, useValue: mockCollaboratorRepository },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: TenantContextService, useValue: mockTenantContextService },
      ],
    }).compile();

    service = await module.resolve(CollaboratorAccessService);
    jest.clearAllMocks();
    mockCollaboratorRepository.findById.mockResolvedValue({
      id: collaboratorId,
      tenantId: TENANT_ID_MOCK,
      name: 'Maria',
    });
  });

  describe('getStatus', () => {
    it('reporta sem acesso quando não há user vinculado', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const status = await service.getStatus(collaboratorId);
      expect(status.hasAccess).toBe(false);
      expect(status.email).toBeNull();
    });

    it('reporta com acesso quando há user', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'maria@salao.com',
        isActive: true,
      });
      const status = await service.getStatus(collaboratorId);
      expect(status).toEqual({
        hasAccess: true,
        userId: 'user-1',
        email: 'maria@salao.com',
        isActive: true,
      });
    });

    it('lança 404 quando colaborador não existe', async () => {
      mockCollaboratorRepository.findById.mockResolvedValue(null);
      await expect(service.getStatus(collaboratorId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('grant', () => {
    it('cria user collaborator vinculado', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findByEmailAndTenant.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        id: 'user-1',
        email: 'maria@salao.com',
        isActive: true,
      });

      const result = await service.grant(collaboratorId, {
        email: 'maria@salao.com',
        password: 'Senha123!',
      });

      expect(result.hasAccess).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'maria@salao.com',
          role: UserRole.COLLABORATOR,
          tenantId: TENANT_ID_MOCK,
          collaboratorId,
          isActive: true,
        }),
      );
    });

    it('recusa se já houver acesso', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-1' });
      await expect(
        service.grant(collaboratorId, {
          email: 'x@y.com',
          password: 'Senha123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('recusa e-mail duplicado no tenant', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findByEmailAndTenant.mockResolvedValue({ id: 'other' });
      await expect(
        service.grant(collaboratorId, {
          email: 'dup@y.com',
          password: 'Senha123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('revoke', () => {
    it('remove o user de acesso', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-1' });
      await service.revoke(collaboratorId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith({
        id: 'user-1',
        tenantId: TENANT_ID_MOCK,
      });
    });

    it('lança 404 se não houver acesso', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.revoke(collaboratorId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
