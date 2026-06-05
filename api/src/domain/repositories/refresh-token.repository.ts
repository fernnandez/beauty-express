import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RefreshToken,
  RefreshTokenAudience,
} from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository extends Repository<RefreshToken> {
  constructor(
    @InjectRepository(RefreshToken)
    repository: Repository<RefreshToken>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByTokenHash(
    tokenHash: string,
    audience: RefreshTokenAudience,
  ): Promise<RefreshToken | null> {
    return await this.findOne({ where: { tokenHash, audience } });
  }

  async revokeByUserId(
    userId: string,
    audience: RefreshTokenAudience,
  ): Promise<void> {
    await this.delete({ userId, audience });
  }
}
