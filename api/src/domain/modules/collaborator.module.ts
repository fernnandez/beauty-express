import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaborator } from '../entities/collaborator.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CollaboratorService } from '../services/collaborator.service';
import { CollaboratorController } from '@application/controllers/collaborator.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Collaborator])],
  controllers: [CollaboratorController],
  providers: [CollaboratorRepository, CollaboratorService],
  exports: [CollaboratorRepository, CollaboratorService],
})
export class CollaboratorModule {}
