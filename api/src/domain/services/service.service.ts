import { CreateServiceDto } from '@application/dtos/service/create-service.dto';
import { UpdateServiceDto } from '@application/dtos/service/update-service.dto';
import { Injectable } from '@nestjs/common';
import { Service } from '../entities/service.entity';
import { ServiceRepository } from '../repositories/service.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';

@Injectable()
export class ServiceService {
  constructor(
    private repository: ServiceRepository,
    private scheduledServiceRepository: ScheduledServiceRepository,
  ) {}

  async createService(createDto: CreateServiceDto): Promise<Service> {
    // Business rule: price must be positive
    if (createDto.defaultPrice <= 0) {
      throw new Error('Default price must be greater than zero');
    }

    // Trata descrição: se for string vazia, converte para null
    const description =
      createDto.description && createDto.description.trim()
        ? createDto.description.trim()
        : null;

    return await this.repository.save({
      ...createDto,
      description,
    });
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

    // Business rule: cannot delete service if it's being used in scheduled services
    const scheduledServices = await this.scheduledServiceRepository.find({
      where: { serviceId: id },
    });

    if (scheduledServices.length > 0) {
      throw new Error(
        'Cannot delete service that is being used in scheduled services. Please cancel or complete the related appointments first.',
      );
    }

    await this.repository.delete(id);
  }
}
