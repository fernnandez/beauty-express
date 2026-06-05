import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { Tenant } from './tenant.entity';

@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  area: string;

  @Column('decimal', { precision: 5, scale: 2 })
  commissionPercentage: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Service, (service) => service.collaborators)
  @JoinTable({
    name: 'collaborator_services',
    joinColumn: { name: 'collaboratorId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' },
  })
  services?: Service[];
}
