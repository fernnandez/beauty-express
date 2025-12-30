import { Repository } from 'typeorm';
import { getDataSource } from '../database/database';
import { Service } from '../entities/Service';

export interface CreateServiceDto {
  name: string;
  defaultPrice: number;
  description?: string;
}

export interface UpdateServiceDto {
  name?: string;
  defaultPrice?: number;
  description?: string;
}

export class ServiceService {
  private repository: Repository<Service>;

  constructor() {
    this.repository = getDataSource().getRepository(Service);
  }

  async findAll(searchTerm?: string): Promise<Service[]> {
    if (searchTerm && searchTerm.trim()) {
      return await this.repository
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.collaborators', 'collaborators')
        .where('service.name LIKE :search', {
          search: `%${searchTerm.trim()}%`,
        })
        .getMany();
    }
    return await this.repository.find({
      relations: ['collaborators'],
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.repository.findOne({
      where: { id },
      relations: ['collaborators'],
    });

    if (!service) {
      throw new Error('Service not found');
    }

    return service;
  }

  async findById(id: string): Promise<Service | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['collaborators'],
    });
  }

  async create(createDto: CreateServiceDto): Promise<Service> {
    // Business rule: price must be positive (cannot be zero or negative)
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

  async update(id: string, updateDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);
    if (!service) {
      throw new Error('Service not found');
    }

    if (updateDto.defaultPrice !== undefined) {
      if (updateDto.defaultPrice <= 0) {
        throw new Error('Default price must be greater than zero');
      }
    }

    // Trata descrição: se for string vazia, converte para null
    if (updateDto.description !== undefined) {
      updateDto.description =
        updateDto.description && updateDto.description.trim()
          ? updateDto.description.trim()
          : null;
    }

    await this.repository.update(id, updateDto);
    return this.findById(id)!;
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    if (!service) {
      throw new Error('Service not found');
    }

    // Business rule: cannot delete service if it's being used in scheduled services
    const { ScheduledService } = require('../entities/ScheduledService');
    const scheduledServiceRepo = getDataSource().getRepository(ScheduledService);
    const scheduledServices = await scheduledServiceRepo.find({
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

