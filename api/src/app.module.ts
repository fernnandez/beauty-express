import { ApplicationModule } from '@application/application.module';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { throttleConfig } from './config/throttle.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig()),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: throttleConfig.loginTtlMs,
          limit: throttleConfig.loginLimit,
        },
      ],
    }),
    ApplicationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
  ],
})
export class AppModule {}
