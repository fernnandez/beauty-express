import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Client } from './client.entity';
import { ConversationStatus } from './whatsapp-enums';

/**
 * Uma conversa de WhatsApp (um chat com um contato) dentro de um tenant.
 * Quando o telefone casa com um Client cadastrado, clientId é preenchido.
 */
@Entity('whatsapp_conversations')
@Index(['tenantId', 'waChatId'], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  /** Identificador do chat no WhatsApp (ex.: 5581999999999@s.whatsapp.net). */
  @Column()
  waChatId: string;

  /** Telefone do contato em formato normalizado (só dígitos). */
  @Column()
  phoneNormalized: string;

  /** Nome exibido do contato (pushName do WhatsApp), quando conhecido. */
  @Column({ type: 'varchar', nullable: true })
  contactName?: string | null;

  /** Cliente cadastrado vinculado a esta conversa, quando o telefone casa. */
  @Column({ type: 'uuid', nullable: true })
  clientId?: string | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client?: Client | null;

  @Column({ type: 'varchar', default: ConversationStatus.OPEN })
  status: ConversationStatus;

  /** Prévia da última mensagem (para a lista de conversas). */
  @Column({ type: 'varchar', nullable: true })
  lastMessagePreview?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt?: Date | null;

  /** Mensagens recebidas e ainda não lidas pelo atendente. */
  @Column({ type: 'int', default: 0 })
  unreadCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
