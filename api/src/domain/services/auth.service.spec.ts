import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRepository } from '@domain/repositories/user.repository';
import { TenantRepository } from '@domain/repositories/tenant.repository';
import { RefreshTokenRepository } from '@domain/repositories/refresh-token.repository';
import { UserRole } from '@domain/entities/user-role.enum';
import { RefreshTokenAudience } from '@domain/entities/refresh-token.entity';

describe('AuthService', () => {
  let service: AuthService;

  const tenant = {
    id: 'c1000001-0001-4000-8000-000000000001',
    slug: 'paulista',
    name: 'Maria Borboleta - Paulista',
    isActive: true,
  };

  const operationalUser = {
    id: 'd1000001-0001-4000-8000-000000000002',
    email: 'admin@paulista.mariaborboleta.com',
    passwordHash: '',
    role: UserRole.ADMIN,
    tenantId: tenant.id,
    tenant,
    isActive: true,
    createdAt: new Date(),
  };

  const superAdmin = {
    id: 'd1000001-0001-4000-8000-000000000001',
    email: 'owner@beautyexpress.com',
    passwordHash: '',
    role: UserRole.SUPER_ADMIN,
    tenantId: null,
    isActive: true,
    createdAt: new Date(),
  };

  const userRepository = {
    findOperationalUser: jest.fn(),
    findSuperAdmin: jest.fn(),
    findByIdWithTenant: jest.fn(),
  };

  const tenantRepository = {
    findBySlug: jest.fn(),
  };

  const refreshTokenRepository = {
    save: jest.fn(),
    findByTokenHash: jest.fn(),
    delete: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('access-token'),
  };

  beforeAll(async () => {
    operationalUser.passwordHash = await bcrypt.hash('Senha123!', 10);
    superAdmin.passwordHash = await bcrypt.hash('SenhaAdmin123!', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
        { provide: TenantRepository, useValue: tenantRepository },
        { provide: RefreshTokenRepository, useValue: refreshTokenRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('should login operational user with valid credentials', async () => {
    tenantRepository.findBySlug.mockResolvedValue(tenant);
    userRepository.findOperationalUser.mockResolvedValue(operationalUser);
    refreshTokenRepository.save.mockResolvedValue({});

    const result = await service.loginOperational({
      tenantSlug: 'paulista',
      email: operationalUser.email,
      password: 'Senha123!',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.user.tenantSlug).toBe('paulista');
    expect(refreshTokenRepository.save).toHaveBeenCalled();
  });

  it('should reject operational login with invalid password', async () => {
    tenantRepository.findBySlug.mockResolvedValue(tenant);
    userRepository.findOperationalUser.mockResolvedValue(operationalUser);

    await expect(
      service.loginOperational({
        tenantSlug: 'paulista',
        email: operationalUser.email,
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should login super admin', async () => {
    userRepository.findSuperAdmin.mockResolvedValue(superAdmin);
    refreshTokenRepository.save.mockResolvedValue({});

    const result = await service.loginAdmin({
      email: superAdmin.email,
      password: 'SenhaAdmin123!',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
  });

  it('should reject operational refresh for super admin token audience mismatch', async () => {
    refreshTokenRepository.findByTokenHash.mockResolvedValue({
      id: 'rt-1',
      userId: superAdmin.id,
      expiresAt: new Date(Date.now() + 60000),
      audience: RefreshTokenAudience.ADMIN,
    });
    userRepository.findByIdWithTenant.mockResolvedValue(superAdmin);

    await expect(
      service.refresh(
        { refreshToken: 'raw-token' },
        RefreshTokenAudience.OPERATIONAL,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should rotate refresh token on valid refresh', async () => {
    refreshTokenRepository.findByTokenHash.mockResolvedValue({
      id: 'rt-1',
      userId: operationalUser.id,
      expiresAt: new Date(Date.now() + 60000),
      audience: RefreshTokenAudience.OPERATIONAL,
    });
    userRepository.findByIdWithTenant.mockResolvedValue(operationalUser);
    refreshTokenRepository.delete.mockResolvedValue({});
    refreshTokenRepository.save.mockResolvedValue({});

    const result = await service.refresh(
      { refreshToken: 'raw-token' },
      RefreshTokenAudience.OPERATIONAL,
    );

    expect(refreshTokenRepository.delete).toHaveBeenCalledWith('rt-1');
    expect(result.refreshToken).toBeDefined();
  });
});
