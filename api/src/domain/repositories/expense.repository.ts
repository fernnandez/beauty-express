import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';

@Injectable()
export class ExpenseRepository extends Repository<Expense> {
  constructor(
    @InjectRepository(Expense)
    repository: Repository<Expense>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string, tenantId: string): Promise<Expense | null> {
    return await this.findOne({ where: { id, tenantId } });
  }

  async findAllByTenant(tenantId: string): Promise<Expense[]> {
    return await this.find({
      where: { tenantId },
      order: { type: 'ASC', description: 'ASC' },
    });
  }

  async findActiveByTenant(tenantId: string): Promise<Expense[]> {
    return await this.find({ where: { tenantId, isActive: true } });
  }
}
