import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappInstance } from '../entities/whatsapp-instance.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Appointment } from '../entities/appointment.entity';
import { WhatsappInstanceRepository } from '../repositories/whatsapp-instance.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { WhatsappService } from '../services/whatsapp.service';
import { WhatsappGateway } from '../services/whatsapp.gateway';
import { WhatsappRateLimiter } from '../services/whatsapp-rate-limiter.service';
import { EvolutionClient } from '../services/evolution.client';
import { WhatsappController } from '@application/controllers/whatsapp.controller';
import { WhatsappWebhookController } from '@application/controllers/whatsapp-webhook.controller';
import { AuthModule } from './auth.module';
import { ClientModule } from './client.module';
import { ServiceModule } from './service.module';
import { mediaStorageProvider } from '../services/media-storage/media-storage.provider';

@Module({
  imports: [
    AuthModule,
    ClientModule,
    ServiceModule,
    TypeOrmModule.forFeature([
      WhatsappInstance,
      Conversation,
      Message,
      Appointment,
    ]),
  ],
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [
    WhatsappInstanceRepository,
    ConversationRepository,
    MessageRepository,
    AppointmentRepository,
    EvolutionClient,
    WhatsappGateway,
    WhatsappRateLimiter,
    WhatsappService,
    mediaStorageProvider,
  ],
  exports: [WhatsappService, WhatsappInstanceRepository],
})
export class WhatsappModule {}
