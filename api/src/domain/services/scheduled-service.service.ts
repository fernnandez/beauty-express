import { CreateScheduledServiceDto } from '@application/dtos/scheduled-service/create-scheduled-service.dto';
import { UpdateScheduledServiceDto } from '@application/dtos/scheduled-service/update-scheduled-service.dto';
import { Injectable } from '@nestjs/common';
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

  async createScheduledService(
    appointmentId: string,
    createDto: CreateScheduledServiceDto,
  ): Promise<ScheduledService> {
    // Business rule: service must exist
    const service = await this.serviceRepository.findById(createDto.serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Business rule: if collaborator is provided, it must exist and be active
    if (createDto.collaboratorId) {
      const collaborator = await this.collaboratorRepository.findById(
        createDto.collaboratorId,
      );
      if (!collaborator) {
        throw new Error('Collaborator not found');
      }
      if (!collaborator.isActive) {
        throw new Error('Collaborator is not active');
      }
    }

    // Create scheduled service using spread operator
    return await this.scheduledServiceRepository.save({
      appointmentId,
      serviceId: createDto.serviceId,
      collaboratorId: createDto.collaboratorId,
      price: createDto.price ?? service.defaultPrice,
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
    console.log('updateDto', updateDto);

    const scheduledService = await this.scheduledServiceRepository.findById(id);
    if (!scheduledService) {
      throw new Error('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.PENDING) {
      throw new Error('Can only update pending scheduled services');
    }

    if (updateDto.serviceId) {
      const service = await this.serviceRepository.findById(
        updateDto.serviceId,
      );
      if (!service) {
        throw new Error('Service not found');
      }
      if (updateDto.price === undefined) {
        updateDto.price = service.defaultPrice;
      }
    }

    if (updateDto.collaboratorId !== undefined) {
      if (updateDto.collaboratorId) {
        const collaborator = await this.collaboratorRepository.findById(
          updateDto.collaboratorId,
        );
        if (!collaborator) {
          throw new Error('Collaborator not found');
        }
        if (!collaborator.isActive) {
          throw new Error('Collaborator is not active');
        }
      }
    }

    // Prepare update payload
    const updatePayload: Partial<ScheduledService> = {};

    if (updateDto.serviceId !== undefined) {
      updatePayload.serviceId = updateDto.serviceId;
    }
    if (updateDto.collaboratorId !== undefined) {
      updatePayload.collaboratorId = updateDto.collaboratorId || undefined;
    }
    if (updateDto.price !== undefined) {
      updatePayload.price = updateDto.price;
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.scheduledServiceRepository.update(id, {
        ...updatePayload,
        collaboratorId: updateDto.collaboratorId || null,
      });
    }

    return await this.scheduledServiceRepository.findById(id);
  }

  async completeScheduledService(id: string): Promise<ScheduledService> {
    const scheduledService = await this.scheduledServiceRepository.findById(id);
    if (!scheduledService) {
      throw new Error('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.PENDING) {
      throw new Error('Can only complete pending  scheduled services');
    }

    if (!scheduledService.collaboratorId) {
      throw new Error(
        'ScheduledService must have a collaborator assigned to be completed',
      );
    }

    scheduledService.status = ScheduledServiceStatus.COMPLETED;
    const savedService =
      await this.scheduledServiceRepository.save(scheduledService);

    // Criar comissão automaticamente ao concluir o serviço
    await this.createCommissionForService(savedService);

    return savedService;
  }

  private async createCommissionForService(
    scheduledService: ScheduledService,
  ): Promise<Commission> {
    // Verificar se já existe comissão para este serviço
    const existingCommission =
      await this.commissionRepository.findByScheduledServiceId(
        scheduledService.id,
      );
    if (existingCommission) {
      return existingCommission;
    }

    // Buscar colaborador para obter o percentual
    const collaborator = await this.collaboratorRepository.findById(
      scheduledService.collaboratorId!,
    );
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    // Calcular comissão
    const percentage = collaborator.commissionPercentage;
    const amount = (Number(scheduledService.price) * percentage) / 100;

    // Criar comissão com status "awaiting payment" (paid = false) usando spread operator
    return await this.commissionRepository.save({
      collaboratorId: scheduledService.collaboratorId!,
      scheduledServiceId: scheduledService.id,
      amount,
      percentage,
      paid: false, // Aguardando pagamento
    });
  }

  async cancelScheduledService(id: string): Promise<ScheduledService> {
    const scheduledService = await this.scheduledServiceRepository.findById(id);
    if (!scheduledService) {
      throw new Error('ScheduledService not found');
    }

    // Se já estiver cancelado, retorna sem fazer nada
    if (scheduledService.status === ScheduledServiceStatus.CANCELLED) {
      return scheduledService;
    }

    // Sempre marca como cancelado, nunca exclui fisicamente (mantém histórico)
    scheduledService.status = ScheduledServiceStatus.CANCELLED;
    return await this.scheduledServiceRepository.save(scheduledService);
  }
}
