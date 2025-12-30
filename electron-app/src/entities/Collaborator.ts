import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Service } from './Service';

@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

