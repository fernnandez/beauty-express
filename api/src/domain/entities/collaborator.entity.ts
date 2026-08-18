import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CollaboratorCommissionRate } from './collaborator-commission-rate.entity';
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

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(
    () => CollaboratorCommissionRate,
    (rate) => rate.collaborator,
    { cascade: true },
  )
  commissionRates?: CollaboratorCommissionRate[];

  @ManyToMany(() => Service, (service) => service.collaborators)
  @JoinTable({
    name: 'collaborator_services',
    joinColumn: { name: 'collaboratorId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' },
  })
  services?: Service[];
}
