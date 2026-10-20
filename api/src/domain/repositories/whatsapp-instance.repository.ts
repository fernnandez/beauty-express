import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappInstance } from '../entities/whatsapp-instance.entity';

@Injectable()
export class WhatsappInstanceRepository extends Repository<WhatsappInstance> {
  constructor(
    @InjectRepository(WhatsappInstance)
    repository: Repository<WhatsappInstance>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByTenant(tenantId: string): Promise<WhatsappInstance | null> {
    return await this.findOne({ where: { tenantId } });
  }

  async findByInstanceName(
    instanceName: string,
  ): Promise<WhatsappInstance | null> {
    return await this.findOne({ where: { instanceName } });
  }
}
