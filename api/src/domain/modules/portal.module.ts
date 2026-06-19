import { PublicController } from '@application/controllers/public.controller';
import { Portal } from '@domain/entities/portal.entity';
import { PortalRepository } from '@domain/repositories/portal.repository';
import { PortalService } from '@domain/services/portal.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Portal])],
  controllers: [PublicController],
  providers: [PortalService, PortalRepository],
  exports: [PortalService, PortalRepository],
})
export class PortalModule {}
