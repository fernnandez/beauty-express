import { CreateServiceDto } from '@application/dtos/service/create-service.dto';
import { UpdateServiceDto } from '@application/dtos/service/update-service.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeString } from '../../common/utils/string.util';
import { VALIDATION_CONSTANTS } from '../../common/constants/validation.constants';
import { Service } from '../entities/service.entity';
import { ServiceRepository } from '../repositories/service.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';

@Injectable()
export class ServiceService {
  constructor(
    private repository: ServiceRepository,
    private scheduledServiceRepository: ScheduledServiceRepository,
  ) {}

  private validatePrice(price: number): void {
    if (price <= VALIDATION_CONSTANTS.PRICE.MIN) {
      throw new BadRequestException(VALIDATION_CONSTANTS.PRICE.MESSAGE);
    }
  }

  async createService(createDto: CreateServiceDto): Promise<Service> {
    this.validatePrice(createDto.defaultPrice);

    return await this.repository.save({
      ...createDto,
      description: normalizeString(createDto.description),
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
      throw new NotFoundException('Service not found');
    }

    if (updateDto.defaultPrice !== undefined) {
      this.validatePrice(updateDto.defaultPrice);
    }

    const updatePayload: Partial<Service> = { ...updateDto };
    if (updateDto.description !== undefined) {
      updatePayload.description = normalizeString(updateDto.description);
    }

    await this.repository.update(id, updatePayload);

    return await this.repository.findById(id);
  }

  async delete(id: string): Promise<void> {
    const service = await this.repository.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Business rule: cannot delete service if it's being used in scheduled services
    const scheduledServices = await this.scheduledServiceRepository.find({
      where: { serviceId: id },
    });

    if (scheduledServices.length > 0) {
      throw new ConflictException(
        'Cannot delete service that is being used in scheduled services. Please cancel or complete the related appointments first.',
      );
    }

    await this.repository.delete(id);
  }
}
