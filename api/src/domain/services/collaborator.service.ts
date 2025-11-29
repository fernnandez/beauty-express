import { CreateCollaboratorDto } from '@application/dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '@application/dtos/collaborator/update-collaborator.dto';
import { Injectable } from '@nestjs/common';
import { Collaborator } from '../entities/collaborator.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';

@Injectable()
export class CollaboratorService {
  constructor(private repository: CollaboratorRepository) {}

  async createCollaborator(
    createDto: CreateCollaboratorDto,
  ): Promise<Collaborator> {
    // Business rule: commission percentage must be between 0 and 100
    if (
      createDto.commissionPercentage < 0 ||
      createDto.commissionPercentage > 100
    ) {
      throw new Error('Commission percentage must be between 0 and 100');
    }

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
      throw new Error('Collaborator not found');
    }

    if (updateDto.commissionPercentage !== undefined) {
      if (
        updateDto.commissionPercentage < 0 ||
        updateDto.commissionPercentage > 100
      ) {
        throw new Error('Commission percentage must be between 0 and 100');
      }
      collaborator.commissionPercentage = updateDto.commissionPercentage;
    }

    await this.repository.update(id, updateDto);

    return await this.repository.findById(id);
  }

  async delete(id: string): Promise<void> {
    const collaborator = await this.repository.findById(id);
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }
    await this.repository.delete(id);
  }
}
