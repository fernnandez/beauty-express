import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Collaborator } from './collaborator.entity';
import { CollaboratorCommissionRate } from './collaborator-commission-rate.entity';
import { Service } from './service.entity';
import { Tenant } from './tenant.entity';

export enum ScheduledServiceStatus {
  PENDING = 'pendente',
  COMPLETED = 'concluido',
  CANCELLED = 'cancelado',
}

@Entity('scheduled_services')
export class ScheduledService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column()
  appointmentId: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.scheduledServices)
  @JoinColumn({ name: 'appointmentId' })
  appointment?: Appointment;

  @Column()
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'serviceId' })
  service?: Service;

  @Column({ nullable: true })
  collaboratorId?: string;

  @ManyToOne(() => Collaborator, { nullable: true })
  @JoinColumn({ name: 'collaboratorId' })
  collaborator?: Collaborator;

  @Column({ nullable: true })
  commissionRateId?: string;

  @ManyToOne(() => CollaboratorCommissionRate, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'commissionRateId' })
  commissionRate?: CollaboratorCommissionRate;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'varchar',
    default: ScheduledServiceStatus.PENDING,
  })
  status: ScheduledServiceStatus;
}
