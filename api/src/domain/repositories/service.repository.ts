import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';

@Injectable()
export class ServiceRepository extends Repository<Service> {
  constructor(
    @InjectRepository(Service)
    repository: Repository<Service>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string): Promise<Service | null> {
    return await this.findOne({
      where: { id },
      relations: ['collaborators'],
    });
  }

  async searchByName(searchTerm: string): Promise<Service[]> {
    return await this.createQueryBuilder('service')
      .leftJoinAndSelect('service.collaborators', 'collaborators')
      .where('service.name LIKE :search', { search: `%${searchTerm}%` })
      .getMany();
  }
}
