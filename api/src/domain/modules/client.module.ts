import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from '@application/controllers/client.controller';
import { Client } from '../entities/client.entity';
import { ClientRepository } from '../repositories/client.repository';
import { ClientService } from '../services/client.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Client])],
  controllers: [ClientController],
  providers: [ClientRepository, ClientService],
  exports: [ClientRepository, ClientService],
})
export class ClientModule {}
