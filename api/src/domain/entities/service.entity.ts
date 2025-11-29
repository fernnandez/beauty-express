import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Collaborator } from './collaborator.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  defaultPrice: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Collaborator, (collaborator) => collaborator.services)
  collaborators?: Collaborator[];
}
