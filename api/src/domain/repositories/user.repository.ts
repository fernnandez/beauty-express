import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findOperationalUser(
    email: string,
    tenantId: string,
  ): Promise<User | null> {
    return await this.findOne({
      where: { email, tenantId },
      relations: ['tenant'],
    });
  }

  async findSuperAdmin(email: string): Promise<User | null> {
    return await this.findOne({
      where: { email, role: UserRole.SUPER_ADMIN },
    });
  }

  async findByIdWithTenant(id: string): Promise<User | null> {
    return await this.findOne({
      where: { id },
      relations: ['tenant'],
    });
  }
}
