import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entities/client.entity';

@Injectable()
export class ClientRepository extends Repository<Client> {
  constructor(
    @InjectRepository(Client)
    repository: Repository<Client>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string, tenantId: string): Promise<Client | null> {
    return await this.findOne({
      where: { id, tenantId },
    });
  }

  async findByPhoneNormalized(
    phoneNormalized: string,
    tenantId: string,
  ): Promise<Client | null> {
    return await this.findOne({
      where: { phoneNormalized, tenantId },
    });
  }

  async search(
    searchTerm: string,
    tenantId: string,
    limit = 20,
  ): Promise<Client[]> {
    const term = `%${searchTerm.trim()}%`;
    const digits = searchTerm.replace(/\D/g, '');

    const query = this.createQueryBuilder('client')
      .where('client.tenantId = :tenantId', { tenantId })
      .orderBy('client.name', 'ASC')
      .take(limit);

    if (digits.length >= 3) {
      query.andWhere(
        '(client.name ILIKE :term OR client.phoneNormalized LIKE :digits)',
        { term, digits: `%${digits}%` },
      );
    } else {
      query.andWhere('client.name ILIKE :term', { term });
    }

    return await query.getMany();
  }
}
