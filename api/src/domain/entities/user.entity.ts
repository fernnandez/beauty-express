import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserRole } from './user-role.enum';
import { Tenant } from './tenant.entity';
import { Collaborator } from './collaborator.entity';

@Entity('users')
@Unique(['email', 'tenantId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar' })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  /** Vínculo com o registro de colaborador (apenas para role=collaborator). */
  @Column({ type: 'uuid', nullable: true })
  collaboratorId: string | null;

  @ManyToOne(() => Collaborator, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collaboratorId' })
  collaborator?: Collaborator;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
