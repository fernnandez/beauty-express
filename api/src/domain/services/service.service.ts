import { CreateServiceDto } from '@application/dtos/service/create-service.dto';
import { UpdateServiceDto } from '@application/dtos/service/update-service.dto';
import { Injectable } from '@nestjs/common';
import { Service } from '../entities/service.entity';
import { ServiceRepository } from '../repositories/service.repository';

@Injectable()
export class ServiceService {
  constructor(private repository: ServiceRepository) {}

  async createService(createDto: CreateServiceDto): Promise<Service> {
    // Business rule: price must be positive
    if (createDto.defaultPrice <= 0) {
      throw new Error('Default price must be greater than zero');
    }

    return await this.repository.save({ ...createDto });
  }

  async findAll(search?: string): Promise<Service[]> {
    if (search && search.trim()) {
      return await this.repository.searchByName(search.trim());
    }
    return await this.repository.find({ relations: ['collaborators'] });
  }

  async findById(id: string): Promise<Service | null> {
    return await this.repository.findById(id);
  }

  async updateService(
    id: string,
    updateDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.repository.findById(id);
    if (!service) {
      throw new Error('Service not found');
    }

    if (updateDto.defaultPrice !== undefined) {
      if (updateDto.defaultPrice <= 0) {
        throw new Error('Default price must be greater than zero');
      }
    }

    await this.repository.update(id, updateDto);

    return await this.repository.findById(id);
  }

  async delete(id: string): Promise<void> {
    const service = await this.repository.findById(id);
    if (!service) {
      throw new Error('Service not found');
    }
    await this.repository.delete(id);
  }
}
