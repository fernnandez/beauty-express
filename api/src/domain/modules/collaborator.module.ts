import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaborator } from '../entities/collaborator.entity';
import { CollaboratorCommissionRate } from '../entities/collaborator-commission-rate.entity';
import { CollaboratorCommissionRateRepository } from '../repositories/collaborator-commission-rate.repository';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CollaboratorService } from '../services/collaborator.service';
import { CollaboratorController } from '@application/controllers/collaborator.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Collaborator, CollaboratorCommissionRate]),
  ],
  controllers: [CollaboratorController],
  providers: [
    CollaboratorRepository,
    CollaboratorCommissionRateRepository,
    CollaboratorService,
  ],
  exports: [
    CollaboratorRepository,
    CollaboratorCommissionRateRepository,
    CollaboratorService,
  ],
})
export class CollaboratorModule {}
