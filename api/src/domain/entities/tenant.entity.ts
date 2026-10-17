import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TenantSettings } from '../types/tenant-settings.types';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', default: {} })
  settings: TenantSettings;

  @Column({ default: true })
  isActive: boolean;
}
