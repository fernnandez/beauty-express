import { CreateServiceDto } from '@application/dtos/service/create-service.dto';
import { UpdateServiceDto } from '@application/dtos/service/update-service.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { normalizeString } from '../../common/utils/string.util';
import { DeepPartial } from 'typeorm';
import { VALIDATION_CONSTANTS } from '../../common/constants/validation.constants';
import { Service } from '../entities/service.entity';
import { ServiceRepository } from '../repositories/service.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { TenantContextService } from './tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export class ServiceService {
  constructor(
    private repository: ServiceRepository,
    private scheduledServiceRepository: ScheduledServiceRepository,
    private tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  private validatePrice(price: number): void {
    if (price <= VALIDATION_CONSTANTS.PRICE.MIN) {
      throw new BadRequestException(VALIDATION_CONSTANTS.PRICE.MESSAGE);
    }
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

  async createService(createDto: CreateServiceDto): Promise<Service> {
    this.validatePrice(createDto.defaultPrice);
    if (createDto.commissionPercentage !== undefined) {
      this.validateCommissionPercentage(createDto.commissionPercentage);
    }

    const payload: DeepPartial<Service> = {
      ...createDto,
      commissionPercentage: createDto.commissionPercentage ?? 0,
      tenantId: this.getTenantId(),
      description: normalizeString(createDto.description),
    };

    return await this.repository.save(payload);
  }

  async findAll(search?: string): Promise<Service[]> {
    const tenantId = this.getTenantId();

    if (search && search.trim()) {
      return await this.repository.searchByName(search.trim(), tenantId);
    }
    return await this.repository.find({
      where: { tenantId },
      relations: ['collaborators'],
    });
  }

  async findById(id: string): Promise<Service | null> {
    return await this.repository.findById(id, this.getTenantId());
  }

  async updateService(
    id: string,
    updateDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.repository.findById(id, this.getTenantId());
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (updateDto.defaultPrice !== undefined) {
      this.validatePrice(updateDto.defaultPrice);
    }

    if (updateDto.commissionPercentage !== undefined) {
      this.validateCommissionPercentage(updateDto.commissionPercentage);
    }

    const updatePayload: Partial<Service> = { ...updateDto };
    if (updateDto.description !== undefined) {
      updatePayload.description = normalizeString(updateDto.description);
    }

    await this.repository.update(
      { id, tenantId: this.getTenantId() },
      updatePayload,
    );

    const updated = await this.repository.findById(id, this.getTenantId());
    if (!updated) {
      throw new NotFoundException('Service not found');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const tenantId = this.getTenantId();
    const service = await this.repository.findById(id, tenantId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const scheduledServices = await this.scheduledServiceRepository.find({
      where: { serviceId: id, tenantId },
    });

    if (scheduledServices.length > 0) {
      throw new ConflictException(
        'Cannot delete service that is being used in scheduled services. Please cancel or complete the related appointments first.',
      );
    }

    await this.repository.delete({ id, tenantId });
  }
}
