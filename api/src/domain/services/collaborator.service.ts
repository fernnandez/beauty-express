import { CreateCollaboratorDto } from '@application/dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '@application/dtos/collaborator/update-collaborator.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { VALIDATION_CONSTANTS } from '../../common/constants/validation.constants';
import { Collaborator } from '../entities/collaborator.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { TenantContextService } from './tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export class CollaboratorService {
  constructor(
    private repository: CollaboratorRepository,
    private tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  private validateCommissionPercentage(percentage: number): void {
    if (
      percentage < VALIDATION_CONSTANTS.COMMISSION_PERCENTAGE.MIN ||
      percentage > VALIDATION_CONSTANTS.COMMISSION_PERCENTAGE.MAX
    ) {
      throw new BadRequestException(
        VALIDATION_CONSTANTS.COMMISSION_PERCENTAGE.MESSAGE,
      );
    }
  }

  async createCollaborator(
    createDto: CreateCollaboratorDto,
  ): Promise<Collaborator> {
    this.validateCommissionPercentage(createDto.commissionPercentage);

    return await this.repository.save({
      ...createDto,
      tenantId: this.getTenantId(),
      isActive: true,
    });
  }

  async findAll(search?: string): Promise<Collaborator[]> {
    const tenantId = this.getTenantId();

    if (search && search.trim()) {
      return await this.repository.searchByName(search.trim(), tenantId);
    }
    return await this.repository.find({
      where: { tenantId },
      relations: ['services'],
    });
  }

  async findById(id: string): Promise<Collaborator | null> {
    return await this.repository.findById(id, this.getTenantId());
  }

  async updateCollaborator(
    id: string,
    updateDto: UpdateCollaboratorDto,
  ): Promise<Collaborator> {
    const collaborator = await this.repository.findById(id, this.getTenantId());
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    if (updateDto.commissionPercentage !== undefined) {
      this.validateCommissionPercentage(updateDto.commissionPercentage);
    }

    await this.repository.update({ id, tenantId: this.getTenantId() }, updateDto);

    return await this.repository.findById(id, this.getTenantId());
  }

  async delete(id: string): Promise<void> {
    const collaborator = await this.repository.findById(id, this.getTenantId());
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }
    await this.repository.delete({ id, tenantId: this.getTenantId() });
  }
}
