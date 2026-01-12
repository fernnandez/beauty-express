import { CreateCollaboratorDto } from '@application/dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '@application/dtos/collaborator/update-collaborator.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VALIDATION_CONSTANTS } from '../../common/constants/validation.constants';
import { Collaborator } from '../entities/collaborator.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';

@Injectable()
export class CollaboratorService {
  constructor(private repository: CollaboratorRepository) {}

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

    return await this.repository.save({ ...createDto, isActive: true });
  }

  async findAll(search?: string): Promise<Collaborator[]> {
    if (search && search.trim()) {
      return await this.repository.searchByName(search.trim());
    }
    return await this.repository.find({ relations: ['services'] });
  }

  async findById(id: string): Promise<Collaborator | null> {
    return await this.repository.findById(id);
  }

  async updateCollaborator(
    id: string,
    updateDto: UpdateCollaboratorDto,
  ): Promise<Collaborator> {
    const collaborator = await this.repository.findById(id);
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    if (updateDto.commissionPercentage !== undefined) {
      this.validateCommissionPercentage(updateDto.commissionPercentage);
    }

    await this.repository.update(id, updateDto);

    return await this.repository.findById(id);
  }

  async delete(id: string): Promise<void> {
    const collaborator = await this.repository.findById(id);
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }
    await this.repository.delete(id);
  }
}
