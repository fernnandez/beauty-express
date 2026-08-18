import { CreateCollaboratorDto } from '@application/dtos/collaborator/create-collaborator.dto';
import { CollaboratorCommissionRateInputDto } from '@application/dtos/collaborator/commission-rate.dto';
import { UpdateCollaboratorDto } from '@application/dtos/collaborator/update-collaborator.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { VALIDATION_CONSTANTS } from '../../common/constants/validation.constants';
import { Collaborator } from '../entities/collaborator.entity';
import { CollaboratorCommissionRateRepository } from '../repositories/collaborator-commission-rate.repository';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { TenantContextService } from './tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export class CollaboratorService {
  constructor(
    private repository: CollaboratorRepository,
    private commissionRateRepository: CollaboratorCommissionRateRepository,
    private tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  private validateCommissionRates(
    rates: CollaboratorCommissionRateInputDto[] | undefined,
  ): CollaboratorCommissionRateInputDto[] {
    if (!rates) {
      return [];
    }

    return rates.map((rate) => {
      const name = rate.name?.trim();
      if (!name) {
        throw new BadRequestException('Commission rate name is required');
      }

      if (
        rate.percentage < VALIDATION_CONSTANTS.COMMISSION_PERCENTAGE.MIN ||
        rate.percentage > VALIDATION_CONSTANTS.COMMISSION_PERCENTAGE.MAX
      ) {
        throw new BadRequestException(
          VALIDATION_CONSTANTS.COMMISSION_PERCENTAGE.MESSAGE,
        );
      }

      return {
        ...rate,
        name,
      };
    });
  }

  private async syncCommissionRates(
    collaboratorId: string,
    rates: CollaboratorCommissionRateInputDto[],
  ): Promise<void> {
    const tenantId = this.getTenantId();
    const keepIds = rates
      .map((rate) => rate.id)
      .filter((id): id is string => Boolean(id));

    await this.commissionRateRepository.deleteMissingForCollaborator(
      collaboratorId,
      tenantId,
      keepIds,
    );

    for (const rate of rates) {
      if (rate.id) {
        const existing = await this.commissionRateRepository.findById(
          rate.id,
          tenantId,
        );
        if (!existing || existing.collaboratorId !== collaboratorId) {
          throw new BadRequestException('Commission rate not found');
        }

        await this.commissionRateRepository.update(
          { id: rate.id, tenantId },
          { name: rate.name, percentage: rate.percentage },
        );
        continue;
      }

      await this.commissionRateRepository.save({
        tenantId,
        collaboratorId,
        name: rate.name,
        percentage: rate.percentage,
      });
    }
  }

  async createCollaborator(
    createDto: CreateCollaboratorDto,
  ): Promise<Collaborator> {
    const commissionRates = this.validateCommissionRates(
      createDto.commissionRates,
    );

    const saved = await this.repository.save({
      name: createDto.name,
      phone: createDto.phone,
      area: createDto.area,
      tenantId: this.getTenantId(),
      isActive: true,
    });

    await this.syncCommissionRates(saved.id, commissionRates);

    const created = await this.repository.findById(
      saved.id,
      this.getTenantId(),
    );
    if (!created) {
      throw new NotFoundException('Collaborator not found');
    }

    return created;
  }

  async findAll(search?: string): Promise<Collaborator[]> {
    const tenantId = this.getTenantId();

    if (search && search.trim()) {
      return await this.repository.searchByName(search.trim(), tenantId);
    }
    return await this.repository.find({
      where: { tenantId },
      relations: ['services', 'commissionRates'],
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

    const { commissionRates, ...collaboratorFields } = updateDto;

    if (Object.keys(collaboratorFields).length > 0) {
      await this.repository.update(
        { id, tenantId: this.getTenantId() },
        collaboratorFields,
      );
    }

    if (commissionRates !== undefined) {
      await this.syncCommissionRates(
        id,
        this.validateCommissionRates(commissionRates),
      );
    }

    const updated = await this.repository.findById(id, this.getTenantId());
    if (!updated) {
      throw new NotFoundException('Collaborator not found');
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const collaborator = await this.repository.findById(id, this.getTenantId());
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }
    await this.repository.delete({ id, tenantId: this.getTenantId() });
  }
}
