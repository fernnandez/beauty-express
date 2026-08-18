import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CollaboratorCommissionRate } from '../entities/collaborator-commission-rate.entity';

@Injectable()
export class CollaboratorCommissionRateRepository extends Repository<CollaboratorCommissionRate> {
  constructor(
    @InjectRepository(CollaboratorCommissionRate)
    repository: Repository<CollaboratorCommissionRate>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByCollaboratorId(
    collaboratorId: string,
    tenantId: string,
  ): Promise<CollaboratorCommissionRate[]> {
    return await this.find({
      where: { collaboratorId, tenantId },
      order: { name: 'ASC' },
    });
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<CollaboratorCommissionRate | null> {
    return await this.findOne({
      where: { id, tenantId },
    });
  }

  async deleteMissingForCollaborator(
    collaboratorId: string,
    tenantId: string,
    keepIds: string[],
  ): Promise<void> {
    const existing = await this.findByCollaboratorId(collaboratorId, tenantId);
    const idsToDelete = existing
      .map((rate) => rate.id)
      .filter((id) => !keepIds.includes(id));

    if (idsToDelete.length === 0) {
      return;
    }

    await this.delete({ id: In(idsToDelete), tenantId });
  }
}
