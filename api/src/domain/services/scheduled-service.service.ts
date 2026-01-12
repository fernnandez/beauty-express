import { CreateScheduledServiceDto } from '@application/dtos/scheduled-service/create-scheduled-service.dto';
import { UpdateScheduledServiceDto } from '@application/dtos/scheduled-service/update-scheduled-service.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Commission } from '../entities/commission.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { ServiceRepository } from '../repositories/service.repository';

@Injectable()
export class ScheduledServiceService {
  constructor(
    private scheduledServiceRepository: ScheduledServiceRepository,
    private serviceRepository: ServiceRepository,
    private collaboratorRepository: CollaboratorRepository,
    private commissionRepository: CommissionRepository,
  ) {}

  private async validateServiceExists(serviceId: string): Promise<void> {
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
  }

  private async validateCollaboratorActive(
    collaboratorId: string,
  ): Promise<void> {
    const collaborator =
      await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }
    if (!collaborator.isActive) {
      throw new BadRequestException('Collaborator is not active');
    }
  }

  async createScheduledService(
    appointmentId: string,
    createDto: CreateScheduledServiceDto,
  ): Promise<ScheduledService> {
    await this.validateServiceExists(createDto.serviceId);

    if (createDto.collaboratorId) {
      await this.validateCollaboratorActive(createDto.collaboratorId);
    }

    const service = await this.serviceRepository.findById(createDto.serviceId);

    return await this.scheduledServiceRepository.save({
      appointmentId,
      serviceId: createDto.serviceId,
      collaboratorId: createDto.collaboratorId,
      price: createDto.price ?? service!.defaultPrice,
      status: ScheduledServiceStatus.PENDING,
    });
  }

  async findAll(): Promise<ScheduledService[]> {
    return await this.scheduledServiceRepository.find({
      relations: ['appointment', 'service', 'collaborator'],
    });
  }

  async findById(id: string): Promise<ScheduledService | null> {
    return await this.scheduledServiceRepository.findById(id);
  }

  async findByAppointmentId(
    appointmentId: string,
  ): Promise<ScheduledService[]> {
    return await this.scheduledServiceRepository.findByAppointmentId(
      appointmentId,
    );
  }

  async updateScheduledService(
    id: string,
    updateDto: UpdateScheduledServiceDto,
  ): Promise<ScheduledService> {
    const scheduledService = await this.scheduledServiceRepository.findById(id);
    if (!scheduledService) {
      throw new NotFoundException('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.PENDING) {
      throw new BadRequestException(
        'Can only update pending scheduled services',
      );
    }

    if (updateDto.serviceId) {
      await this.validateServiceExists(updateDto.serviceId);
      const service = await this.serviceRepository.findById(
        updateDto.serviceId,
      );
      if (updateDto.price === undefined) {
        updateDto.price = service!.defaultPrice;
      }
    }

    if (updateDto.collaboratorId !== undefined && updateDto.collaboratorId) {
      await this.validateCollaboratorActive(updateDto.collaboratorId);
    }

    const updatePayload: Partial<ScheduledService> = {};

    if (updateDto.serviceId !== undefined) {
      updatePayload.serviceId = updateDto.serviceId;
    }
    if (updateDto.collaboratorId !== undefined) {
      updatePayload.collaboratorId = updateDto.collaboratorId || null;
    }
    if (updateDto.price !== undefined) {
      updatePayload.price = updateDto.price;
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.scheduledServiceRepository.update(id, updatePayload);
    }

    return await this.scheduledServiceRepository.findById(id);
  }

  async completeScheduledService(id: string): Promise<ScheduledService> {
    const scheduledService = await this.scheduledServiceRepository.findById(id);
    if (!scheduledService) {
      throw new NotFoundException('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.PENDING) {
      throw new BadRequestException(
        'Can only complete pending scheduled services',
      );
    }

    if (!scheduledService.collaboratorId) {
      throw new BadRequestException(
        'ScheduledService must have a collaborator assigned to be completed',
      );
    }

    scheduledService.status = ScheduledServiceStatus.COMPLETED;
    const savedService =
      await this.scheduledServiceRepository.save(scheduledService);

    await this.createCommissionForService(savedService);

    return savedService;
  }

  private async createCommissionForService(
    scheduledService: ScheduledService,
  ): Promise<Commission> {
    const existingCommission =
      await this.commissionRepository.findByScheduledServiceId(
        scheduledService.id,
      );
    if (existingCommission) {
      return existingCommission;
    }

    const collaborator = await this.collaboratorRepository.findById(
      scheduledService.collaboratorId!,
    );
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    const percentage = collaborator.commissionPercentage;
    const amount = (Number(scheduledService.price) * percentage) / 100;

    return await this.commissionRepository.save({
      collaboratorId: scheduledService.collaboratorId!,
      scheduledServiceId: scheduledService.id,
      amount,
      percentage,
      paid: false,
    });
  }

  async cancelScheduledService(id: string): Promise<ScheduledService> {
    const scheduledService = await this.scheduledServiceRepository.findById(id);
    if (!scheduledService) {
      throw new NotFoundException('ScheduledService not found');
    }

    if (scheduledService.status === ScheduledServiceStatus.CANCELLED) {
      return scheduledService;
    }

    scheduledService.status = ScheduledServiceStatus.CANCELLED;
    return await this.scheduledServiceRepository.save(scheduledService);
  }
}
