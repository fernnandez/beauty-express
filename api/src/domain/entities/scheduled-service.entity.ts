import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Collaborator } from './collaborator.entity';
import { Service } from './service.entity';

export enum ScheduledServiceStatus {
  PENDING = 'pendente',
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

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'varchar',
    default: ScheduledServiceStatus.PENDING,
  })
  status: ScheduledServiceStatus;
}
