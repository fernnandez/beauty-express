import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LoginBranding } from '../types/branding.types';
import { Tenant } from './tenant.entity';

@Entity('portals')
export class Portal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ unique: true })
  host: string;

  @Column({ type: 'jsonb', default: {} })
  loginBranding: LoginBranding;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Tenant, (tenant) => tenant.portal)
  tenants?: Tenant[];
}
