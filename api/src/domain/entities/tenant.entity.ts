import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TenantSettings } from '../types/tenant-settings.types';
import { Portal } from './portal.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'uuid' })
  portalId: string;

  @ManyToOne(() => Portal, (portal) => portal.tenants)
  @JoinColumn({ name: 'portalId' })
  portal?: Portal;

  @Column({ type: 'jsonb', default: {} })
  settings: TenantSettings;

  @Column({ default: true })
  isActive: boolean;
}
