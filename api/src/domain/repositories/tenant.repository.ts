import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class TenantRepository extends Repository<Tenant> {
  constructor(
    @InjectRepository(Tenant)
    repository: Repository<Tenant>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return await this.findOne({ where: { slug } });
  }
}
