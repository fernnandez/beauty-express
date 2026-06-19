import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portal } from '../entities/portal.entity';

@Injectable()
export class PortalRepository extends Repository<Portal> {
  constructor(
    @InjectRepository(Portal)
    repository: Repository<Portal>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByHost(host: string): Promise<Portal | null> {
    return await this.findOne({
      where: { host: host.toLowerCase() },
    });
  }

  async findBySlug(slug: string): Promise<Portal | null> {
    return await this.findOne({
      where: { slug },
    });
  }
}
