import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { WhatsappInstanceStatus } from './whatsapp-enums';

/**
 * Representa a conexão de um número de WhatsApp (uma instância da Evolution API)
 * pertencente a um tenant. Cada salão conecta o próprio número.
 */
@Entity('whatsapp_instances')
export class WhatsappInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  /** Nome único da instância na Evolution API (usado nas chamadas e no webhook). */
  @Column({ unique: true })
  instanceName: string;

  /** Número conectado em formato normalizado (só dígitos), quando conhecido. */
  @Column({ type: 'varchar', nullable: true })
  phoneNormalized?: string | null;

  @Column({ type: 'varchar', default: WhatsappInstanceStatus.DISCONNECTED })
  status: WhatsappInstanceStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
