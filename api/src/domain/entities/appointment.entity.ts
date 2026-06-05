import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ScheduledService } from './scheduled-service.entity';
import { Tenant } from './tenant.entity';

export enum AppointmentStatus {
  SCHEDULED = 'agendado',
  COMPLETED = 'concluido',
  CANCELLED = 'cancelado',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column()
  clientName: string;

  @Column()
  clientPhone: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column('varchar')
  startTime: string; // Formato HH:MM

  @Column('varchar')
  endTime: string; // Formato HH:MM

  @Column({
    type: 'varchar',
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @OneToMany(
    () => ScheduledService,
    (scheduledService) => scheduledService.appointment,
  )
  scheduledServices?: ScheduledService[];
}
