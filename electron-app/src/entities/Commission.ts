import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Collaborator } from './Collaborator';
import { ScheduledService } from './ScheduledService';

@Entity('commissions')
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  collaboratorId: string;

  @ManyToOne(() => Collaborator)
  collaborator?: Collaborator;

  @Column()
  scheduledServiceId: string;

  @ManyToOne(() => ScheduledService)
  @JoinColumn({ name: 'scheduledServiceId' })
  scheduledService?: ScheduledService;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  percentage: number;

  @Column({ default: false })
  paid: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

