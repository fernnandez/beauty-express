import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, IsNull } from 'typeorm';
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

  async findOperationalUsersByEmail(email: string): Promise<User[]> {
    return await this.find({
      where: {
        email,
        role: Not(UserRole.SUPER_ADMIN),
      },
      relations: ['tenant', 'tenant.portal'],
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
      relations: ['tenant', 'tenant.portal'],
    });
  }

  async findByEmailAndTenant(
    email: string,
    tenantId: string | null,
    excludeId?: string,
  ): Promise<User | null> {
    const where =
      tenantId === null
        ? { email, tenantId: IsNull() }
        : { email, tenantId };

    const user = await this.findOne({ where });
    if (!user) {
      return null;
    }
    if (excludeId && user.id === excludeId) {
      return null;
    }
    return user;
  }
}
