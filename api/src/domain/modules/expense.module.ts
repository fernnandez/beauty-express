import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../entities/expense.entity';
import { ExpenseRepository } from '../repositories/expense.repository';
import { ExpenseService } from '../services/expense.service';
import { ExpenseController } from '@application/controllers/expense.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Expense])],
  controllers: [ExpenseController],
  providers: [ExpenseRepository, ExpenseService],
  exports: [ExpenseRepository, ExpenseService],
})
export class ExpenseModule {}
