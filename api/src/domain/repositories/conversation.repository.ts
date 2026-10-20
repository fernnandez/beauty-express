import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class ConversationRepository extends Repository<Conversation> {
  constructor(
    @InjectRepository(Conversation)
    repository: Repository<Conversation>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string, tenantId: string): Promise<Conversation | null> {
    return await this.findOne({ where: { id, tenantId } });
  }

  async findByWaChatId(
    waChatId: string,
    tenantId: string,
  ): Promise<Conversation | null> {
    return await this.findOne({ where: { waChatId, tenantId } });
  }

  async listByTenant(tenantId: string, limit = 50): Promise<Conversation[]> {
    return await this.find({
      where: { tenantId },
      order: { lastMessageAt: 'DESC' },
      take: limit,
    });
  }

  /** Número de conversas com mensagens não lidas no tenant. */
  async countUnreadConversations(tenantId: string): Promise<number> {
    return await this.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.unreadCount > 0')
      .getCount();
  }
}
