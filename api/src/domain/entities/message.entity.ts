import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Conversation } from './conversation.entity';
import { MessageDirection, MessageStatus, MessageType } from './whatsapp-enums';

/**
 * Uma mensagem individual dentro de uma conversa (recebida ou enviada).
 * O espelho local do histórico de WhatsApp.
 */
@Entity('whatsapp_messages')
@Index(['tenantId', 'waMessageId'], { unique: true })
@Index(['tenantId', 'conversationId', 'timestamp'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation?: Conversation;

  /** ID da mensagem no WhatsApp (usado para dedupe de webhooks). */
  @Column({ type: 'varchar', nullable: true })
  waMessageId?: string | null;

  @Column({ type: 'varchar' })
  direction: MessageDirection;

  @Column({ type: 'varchar', default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content?: string | null;

  /** URL/referência de mídia quando o tipo não é texto. */
  @Column({ type: 'varchar', nullable: true })
  mediaUrl?: string | null;

  /** Emoji de reação aplicado a esta mensagem (ex.: ❤️), ou nulo. */
  @Column({ type: 'varchar', nullable: true })
  reaction?: string | null;

  /** waMessageId da mensagem citada, quando esta é uma resposta (reply). */
  @Column({ type: 'varchar', nullable: true })
  quotedWaMessageId?: string | null;

  /** Prévia (texto/rotulo) da mensagem citada, para exibir acima da resposta. */
  @Column({ type: 'varchar', nullable: true })
  quotedPreview?: string | null;

  @Column({ type: 'varchar', default: MessageStatus.SENT })
  status: MessageStatus;

  /** Usuário (atendente) que enviou, quando a mensagem é outbound pelo sistema. */
  @Column({ type: 'uuid', nullable: true })
  sentByUserId?: string | null;

  /** Momento da mensagem no WhatsApp (pode diferir do createdAt local). */
  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
