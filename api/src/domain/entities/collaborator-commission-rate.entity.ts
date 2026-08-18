import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Collaborator } from './collaborator.entity';
import { Tenant } from './tenant.entity';

@Entity('collaborator_commission_rates')
export class CollaboratorCommissionRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column({ type: 'uuid' })
  collaboratorId: string;

  @ManyToOne(
    () => Collaborator,
    (collaborator) => collaborator.commissionRates,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'collaboratorId' })
  collaborator?: Collaborator;

  @Column()
  name: string;

  @Column('decimal', { precision: 5, scale: 2 })
  percentage: number;
}
