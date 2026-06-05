import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum RefreshTokenAudience {
  OPERATIONAL = 'operational',
  ADMIN = 'admin',
}

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  tokenHash: string;

  @Column({ type: 'varchar' })
  audience: RefreshTokenAudience;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
