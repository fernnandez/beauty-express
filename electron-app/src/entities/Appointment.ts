import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ScheduledService } from './ScheduledService';

export enum AppointmentStatus {
  SCHEDULED = 'agendado',
  COMPLETED = 'concluido',
  CANCELLED = 'cancelado',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientName: string;

  @Column()
  clientPhone: string;

  @Column('datetime')
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

