import { LoginDto } from '@application/dtos/auth/login.dto';
import { AdminLoginDto } from '@application/dtos/auth/admin-login.dto';
import { RefreshTokenDto } from '@application/dtos/auth/refresh-token.dto';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { jwtConfig, parseExpiresInSeconds } from '@config/jwt.config';
import { UserRole } from '@domain/entities/user-role.enum';
import { User } from '@domain/entities/user.entity';
import {
  RefreshTokenAudience,
} from '@domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@domain/repositories/refresh-token.repository';
import { TenantRepository } from '@domain/repositories/tenant.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  AuthTokens,
  AuthUserResponse,
  AccessTokenPayload,
} from './auth.types';

@Injectable()
export class AuthService {
  private readonly accessExpiresInSeconds = parseExpiresInSeconds(
    jwtConfig.accessExpiresIn,
  );

  constructor(
    private readonly userRepository: UserRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async loginOperational(dto: LoginDto): Promise<AuthTokens & { user: AuthUserResponse }> {
    const tenant = await this.tenantRepository.findBySlug(dto.tenantSlug);
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const user = await this.userRepository.findOperationalUser(
      dto.email,
      tenant.id,
    );

    await this.validateOperationalUser(user, dto.password);

    const tokens = await this.issueTokens(user, RefreshTokenAudience.OPERATIONAL);

    return {
      ...tokens,
      user: this.toUserResponse(user),
    };
  }

  async loginAdmin(
    dto: AdminLoginDto,
  ): Promise<AuthTokens & { user: AuthUserResponse }> {
    const user = await this.userRepository.findSuperAdmin(dto.email);
    if (!user || !user.isActive || user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.issueTokens(user, RefreshTokenAudience.ADMIN);

    return {
      ...tokens,
      user: this.toUserResponse(user),
    };
  }

  async refresh(
    dto: RefreshTokenDto,
    audience: RefreshTokenAudience,
  ): Promise<AuthTokens> {
    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(
      tokenHash,
      audience,
    );

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = await this.userRepository.findByIdWithTenant(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inválido');
    }

    if (audience === RefreshTokenAudience.ADMIN) {
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Acesso negado');
      }
    } else if (!user.tenantId || user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.refreshTokenRepository.delete(stored.id);

    return await this.issueTokens(user, audience);
  }

  async logout(
    refreshToken: string,
    audience: RefreshTokenAudience,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepository.delete({ tokenHash, audience });
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.userRepository.findByIdWithTenant(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return this.toUserResponse(user);
  }

  buildJwtPayload(user: User): AccessTokenPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      type: 'access',
    };
  }

  private async validateOperationalUser(
    user: User | null,
    password: string,
  ): Promise<void> {
    if (
      !user ||
      !user.isActive ||
      user.role === UserRole.SUPER_ADMIN ||
      !user.tenantId
    ) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }

  private async issueTokens(
    user: User,
    audience: RefreshTokenAudience,
  ): Promise<AuthTokens> {
    const payload = this.buildJwtPayload(user);

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtConfig.accessSecret,
      expiresIn: jwtConfig.accessExpiresIn,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpiresMs =
      parseExpiresInSeconds(jwtConfig.refreshExpiresIn) * 1000;

    await this.refreshTokenRepository.save({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      audience,
      expiresAt: new Date(Date.now() + refreshExpiresMs),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresInSeconds,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toUserResponse(user: User): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug,
      tenantName: user.tenant?.name,
    };
  }
}
