import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Appointment } from './Appointment';
import { Service } from './Service';
import { Collaborator } from './Collaborator';
import { Commission } from './Commission';

export enum ScheduledServiceStatus {
  PENDING = 'pendente',
  STARTED = 'iniciado',
  COMPLETED = 'concluido',
  CANCELLED = 'cancelado',
}

@Entity('scheduled_services')
export class ScheduledService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appointmentId: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.scheduledServices)
  appointment?: Appointment;

  @Column()
  serviceId: string;

  @ManyToOne(() => Service)
  service?: Service;

  @Column({ nullable: true })
  collaboratorId?: string;

  @ManyToOne(() => Collaborator)
  collaborator?: Collaborator;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'varchar',
    default: ScheduledServiceStatus.PENDING,
  })
  status: ScheduledServiceStatus;

  @OneToOne(() => Commission, (commission) => commission.scheduledService, { nullable: true })
  commission?: Commission;
}

