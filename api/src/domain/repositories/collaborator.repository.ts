import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator } from '../entities/collaborator.entity';

@Injectable()
export class CollaboratorRepository extends Repository<Collaborator> {
  constructor(
    @InjectRepository(Collaborator)
    repository: Repository<Collaborator>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string): Promise<Collaborator | null> {
    return await this.findOne({
      where: { id },
      relations: ['services'],
    });
  }

  async searchByName(searchTerm: string): Promise<Collaborator[]> {
    return await this.createQueryBuilder('collaborator')
      .leftJoinAndSelect('collaborator.services', 'services')
      .where('collaborator.name LIKE :search', { search: `%${searchTerm}%` })
      .getMany();
  }
}
