import { AuthController } from '@application/controllers/auth.controller';
import { JwtStrategy } from '@application/strategies/jwt.strategy';
import { jwtConfig } from '@config/jwt.config';
import { RefreshToken } from '@domain/entities/refresh-token.entity';
import { Tenant } from '@domain/entities/tenant.entity';
import { User } from '@domain/entities/user.entity';
import { RefreshTokenRepository } from '@domain/repositories/refresh-token.repository';
import { TenantRepository } from '@domain/repositories/tenant.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { AuthService } from '@domain/services/auth.service';
import { TenantContextService } from '@domain/services/tenant-context.service';
import { TenantSettingsService } from '@domain/services/tenant-settings.service';
import { PortalModule } from './portal.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConfig.accessSecret,
      signOptions: { expiresIn: jwtConfig.accessExpiresIn },
    }),
    PortalModule,
    TypeOrmModule.forFeature([User, Tenant, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UserRepository,
    TenantRepository,
    RefreshTokenRepository,
    TenantContextService,
    TenantSettingsService,
  ],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    TenantContextService,
    UserRepository,
    TenantRepository,
    TenantSettingsService,
  ],
})
export class AuthModule {}
