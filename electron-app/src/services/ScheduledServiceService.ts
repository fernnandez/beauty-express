import { Repository } from 'typeorm';
import { getDataSource } from '../database/database';
import { ScheduledService, ScheduledServiceStatus } from '../entities/ScheduledService';
import { Commission } from '../entities/Commission';
import { Collaborator } from '../entities/Collaborator';
import { Service } from '../entities/Service';

export interface CreateScheduledServiceDto {
  serviceId: string;
  collaboratorId?: string;
  price?: number;
}

export interface UpdateScheduledServiceDto {
  serviceId?: string;
  collaboratorId?: string;
  price?: number;
}

export class ScheduledServiceService {
  private repository: Repository<ScheduledService>;
  private serviceRepository: Repository<Service>;
  private collaboratorRepository: Repository<Collaborator>;
  private commissionRepository: Repository<Commission>;

  constructor() {
    this.repository = getDataSource().getRepository(ScheduledService);
    this.serviceRepository = getDataSource().getRepository(Service);
    this.collaboratorRepository = getDataSource().getRepository(Collaborator);
    this.commissionRepository = getDataSource().getRepository(Commission);
  }

  async createScheduledService(
    appointmentId: string,
    createDto: CreateScheduledServiceDto,
  ): Promise<ScheduledService> {
    // Business rule: service must exist
    const service = await this.serviceRepository.findOne({
      where: { id: createDto.serviceId },
      relations: ['collaborators'],
    });
    if (!service) {
      throw new Error('Service not found');
    }

    // Business rule: if collaborator is provided, it must exist and be active
    if (createDto.collaboratorId) {
      const collaborator = await this.collaboratorRepository.findOne({
        where: { id: createDto.collaboratorId },
      });
      if (!collaborator) {
        throw new Error('Collaborator not found');
      }
      if (!collaborator.isActive) {
        throw new Error('Collaborator is not active');
      }
    }

    // Create scheduled service using spread operator
    return await this.repository.save({
      appointmentId,
      serviceId: createDto.serviceId,
      collaboratorId: createDto.collaboratorId,
      price: createDto.price ?? service.defaultPrice,
      status: ScheduledServiceStatus.PENDING,
    });
  }

  async findAll(): Promise<ScheduledService[]> {
    return await this.repository.find({
      relations: ['appointment', 'service', 'collaborator'],
    });
  }

  async findById(id: string): Promise<ScheduledService | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['appointment', 'service', 'collaborator'],
    });
  }

  async findByAppointmentId(
    appointmentId: string,
  ): Promise<ScheduledService[]> {
    return await this.repository.find({
      where: { appointmentId },
      relations: ['service', 'collaborator'],
    });
  }

  async updateScheduledService(
    id: string,
    updateDto: UpdateScheduledServiceDto,
  ): Promise<ScheduledService> {
    const scheduledService = await this.findById(id);
    if (!scheduledService) {
      throw new Error('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.PENDING) {
      throw new Error('Can only update pending scheduled services');
    }

    // Business rule: if service is being updated, it must exist
    if (updateDto.serviceId) {
      const service = await this.serviceRepository.findOne({
        where: { id: updateDto.serviceId },
      });
      if (!service) {
        throw new Error('Service not found');
      }
      // If service changes and price is not provided, update to new service default price
      if (updateDto.price === undefined) {
        updateDto.price = service.defaultPrice;
      }
    }

    // Business rule: if collaborator is being updated, it must exist and be active
    if (updateDto.collaboratorId !== undefined) {
      if (updateDto.collaboratorId) {
        const collaborator = await this.collaboratorRepository.findOne({
          where: { id: updateDto.collaboratorId },
        });
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

    // Update using repository.update
    if (Object.keys(updatePayload).length > 0) {
      await this.repository.update(id, updatePayload);
    }

    return await this.findById(id)!;
  }

  async completeScheduledService(id: string): Promise<ScheduledService> {
    const scheduledService = await this.findById(id);
    if (!scheduledService) {
      throw new Error('ScheduledService not found');
    }

    if (scheduledService.status !== ScheduledServiceStatus.PENDING) {
      throw new Error('Can only complete pending scheduled services');
    }

    if (!scheduledService.collaboratorId) {
      throw new Error(
        'ScheduledService must have a collaborator assigned to be completed',
      );
    }

    scheduledService.status = ScheduledServiceStatus.COMPLETED;
    const savedService = await this.repository.save(scheduledService);

    // Criar comissão automaticamente ao concluir o serviço
    await this.createCommissionForService(savedService);

    return savedService;
  }

  private async createCommissionForService(
    scheduledService: ScheduledService,
  ): Promise<Commission> {
    // Verificar se já existe comissão para este serviço
    const existingCommission = await this.commissionRepository.findOne({
      where: { scheduledServiceId: scheduledService.id },
    });
    if (existingCommission) {
      return existingCommission;
    }

    // Buscar colaborador para obter o percentual
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id: scheduledService.collaboratorId! },
    });
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
    const scheduledService = await this.findById(id);
    if (!scheduledService) {
      throw new Error('ScheduledService not found');
    }

    if (scheduledService.status === ScheduledServiceStatus.COMPLETED) {
      throw new Error('Cannot cancel completed scheduled services');
    }

    scheduledService.status = ScheduledServiceStatus.CANCELLED;
    return await this.repository.save(scheduledService);
  }
}

