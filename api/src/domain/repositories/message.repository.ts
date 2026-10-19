import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(
    @InjectRepository(Message)
    repository: Repository<Message>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByWaMessageId(
    waMessageId: string,
    tenantId: string,
  ): Promise<Message | null> {
    return await this.findOne({ where: { waMessageId, tenantId } });
  }

  async findById(id: string, tenantId: string): Promise<Message | null> {
    return await this.findOne({ where: { id, tenantId } });
  }

  async listByConversation(
    conversationId: string,
    tenantId: string,
    limit = 100,
  ): Promise<Message[]> {
    return await this.find({
      where: { conversationId, tenantId },
      order: { timestamp: 'ASC' },
      take: limit,
    });
  }
}
