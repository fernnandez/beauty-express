import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { ExpenseCategory, ExpenseType } from './expense-enums';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column()
  description: string;

  @Column({ type: 'varchar', default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: ExpenseType.ONE_TIME })
  type: ExpenseType;

  /**
   * Despesa esporádica (one_time): data em que ocorreu (yyyy-MM-dd).
   * Nulo para despesas recorrentes.
   */
  @Column({ type: 'date', nullable: true })
  date?: string | null;

  /**
   * Despesa fixa (recurring): dia do mês de vencimento (1-31).
   * Nulo para despesas esporádicas.
   */
  @Column({ type: 'int', nullable: true })
  dayOfMonth?: number | null;

  /** Despesa fixa: início da vigência (yyyy-MM-dd). */
  @Column({ type: 'date', nullable: true })
  startDate?: string | null;

  /** Despesa fixa: fim da vigência (yyyy-MM-dd) ou nulo se ainda ativa. */
  @Column({ type: 'date', nullable: true })
  endDate?: string | null;

  @Column({ default: true })
  isActive: boolean;
}
