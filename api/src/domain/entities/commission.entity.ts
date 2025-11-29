import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Collaborator } from './collaborator.entity';
import { ScheduledService } from './scheduled-service.entity';

@Entity('commissions')
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  collaboratorId: string;

  @ManyToOne(() => Collaborator)
  @JoinColumn({ name: 'collaboratorId' })
  collaborator?: Collaborator;

  @Column({ unique: true })
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
}
