import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { Expense } from '../entities/expense.entity';
import { ExpenseType } from '../entities/expense-enums';
import { ExpenseRepository } from '../repositories/expense.repository';
import { TenantContextService } from './tenant-context.service';
import { CreateExpenseDto } from '@application/dtos/expense/create-expense.dto';
import { UpdateExpenseDto } from '@application/dtos/expense/update-expense.dto';

export interface ExpensesPeriodResult {
  /** Total de despesas (fixas + esporádicas) que incidem no período. */
  total: number;
  /** Quebra por categoria. */
  byCategory: Record<string, number>;
}

const ZONE = 'America/Sao_Paulo';

@Injectable({ scope: Scope.REQUEST })
export class ExpenseService {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  private validatePayload(
    type: ExpenseType | undefined,
    dto: CreateExpenseDto | UpdateExpenseDto,
  ): void {
    if (type === ExpenseType.ONE_TIME && !dto.date) {
      throw new BadRequestException(
        'Despesa esporádica exige a data (campo date).',
      );
    }
    if (type === ExpenseType.RECURRING && !dto.dayOfMonth) {
      throw new BadRequestException(
        'Despesa fixa exige o dia de vencimento (campo dayOfMonth).',
      );
    }
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const tenantId = this.getTenantId();
    this.validatePayload(dto.type, dto);

    const expense = this.expenseRepository.create({
      tenantId,
      description: dto.description,
      category: dto.category,
      amount: dto.amount,
      type: dto.type,
      date: dto.type === ExpenseType.ONE_TIME ? dto.date : null,
      dayOfMonth: dto.type === ExpenseType.RECURRING ? dto.dayOfMonth : null,
      startDate:
        dto.type === ExpenseType.RECURRING ? (dto.startDate ?? null) : null,
      endDate:
        dto.type === ExpenseType.RECURRING ? (dto.endDate ?? null) : null,
      isActive: true,
    });

    return await this.expenseRepository.save(expense);
  }

  async findAll(): Promise<Expense[]> {
    return await this.expenseRepository.findAllByTenant(this.getTenantId());
  }

  async findById(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findById(
      id,
      this.getTenantId(),
    );
    if (!expense) {
      throw new NotFoundException('Despesa não encontrada');
    }
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const tenantId = this.getTenantId();
    const expense = await this.expenseRepository.findById(id, tenantId);
    if (!expense) {
      throw new NotFoundException('Despesa não encontrada');
    }

    const nextType = dto.type ?? expense.type;

    const merged: UpdateExpenseDto = {
      date: dto.date !== undefined ? dto.date : expense.date,
      dayOfMonth:
        dto.dayOfMonth !== undefined ? dto.dayOfMonth : expense.dayOfMonth,
    };
    this.validatePayload(nextType, merged);

    Object.assign(expense, {
      ...dto,
      // Garante consistência dos campos conforme o tipo.
      date: nextType === ExpenseType.ONE_TIME ? (merged.date ?? null) : null,
      dayOfMonth:
        nextType === ExpenseType.RECURRING ? (merged.dayOfMonth ?? null) : null,
      type: nextType,
    });

    return await this.expenseRepository.save(expense);
  }

  async delete(id: string): Promise<void> {
    const tenantId = this.getTenantId();
    const expense = await this.expenseRepository.findById(id, tenantId);
    if (!expense) {
      throw new NotFoundException('Despesa não encontrada');
    }
    await this.expenseRepository.delete({ id, tenantId });
  }

  /**
   * Soma das despesas que incidem no período [startDate, endDate] (yyyy-MM-dd).
   * - Esporádicas: contam se a data cair no período.
   * - Fixas: contam (valor integral) para cada vencimento (dayOfMonth) que
   *   cair no período, respeitando a vigência (startDate/endDate) e isActive.
   */
  async getExpensesForPeriod(
    startDate: string,
    endDate: string,
  ): Promise<ExpensesPeriodResult> {
    const tenantId = this.getTenantId();
    const expenses = await this.expenseRepository.findActiveByTenant(tenantId);

    const start = DateTime.fromISO(startDate, { zone: ZONE }).startOf('day');
    const end = DateTime.fromISO(endDate, { zone: ZONE }).endOf('day');

    const byCategory: Record<string, number> = {};
    let total = 0;

    const add = (category: string, amount: number) => {
      total += amount;
      byCategory[category] = (byCategory[category] ?? 0) + amount;
    };

    for (const expense of expenses) {
      const amount = Number(expense.amount);

      if (expense.type === ExpenseType.ONE_TIME) {
        if (!expense.date) continue;
        const d = DateTime.fromISO(expense.date, { zone: ZONE });
        if (d >= start && d <= end) {
          add(expense.category, amount);
        }
        continue;
      }

      // Recorrente (fixa)
      if (!expense.dayOfMonth) continue;

      const vigStart = expense.startDate
        ? DateTime.fromISO(expense.startDate, { zone: ZONE }).startOf('day')
        : null;
      const vigEnd = expense.endDate
        ? DateTime.fromISO(expense.endDate, { zone: ZONE }).endOf('day')
        : null;

      // Itera cada mês tocado pelo período e verifica o vencimento.
      let cursor = start.startOf('month');
      const lastMonth = end.startOf('month');
      while (cursor <= lastMonth) {
        const daysInMonth = cursor.daysInMonth ?? 31;
        const dueDay = Math.min(expense.dayOfMonth, daysInMonth);
        const dueDate = cursor.set({ day: dueDay });

        const inPeriod = dueDate >= start && dueDate <= end;
        const inVigency =
          (!vigStart || dueDate >= vigStart) && (!vigEnd || dueDate <= vigEnd);

        if (inPeriod && inVigency) {
          add(expense.category, amount);
        }

        cursor = cursor.plus({ months: 1 });
      }
    }

    return { total, byCategory };
  }
}
