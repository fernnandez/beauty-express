import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Collaborator } from './collaborator.entity';
import { Tenant } from './tenant.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  defaultPrice: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Collaborator, (collaborator) => collaborator.services)
  collaborators?: Collaborator[];
}
