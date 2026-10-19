import { startOfDay, endOfDay } from '../../utils/date.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class AppointmentRepository extends Repository<Appointment> {
  constructor(
    @InjectRepository(Appointment)
    repository: Repository<Appointment>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string, tenantId: string): Promise<Appointment | null> {
    return await this.findOne({
      where: { id, tenantId },
      relations: [
        'scheduledServices',
        'scheduledServices.service',
        'scheduledServices.collaborator',
      ],
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Appointment[]> {
    return await this.find({
      where: {
        date: Between(startDate, endDate),
        tenantId,
      },
      relations: [
        'scheduledServices',
        'scheduledServices.service',
        'scheduledServices.collaborator',
      ],
    });
  }

  async findByDate(date: Date, tenantId: string): Promise<Appointment[]> {
    const start = startOfDay(date);
    const end = endOfDay(date);

    return await this.find({
      where: {
        date: Between(start, end),
        tenantId,
      },
      relations: [
        'scheduledServices',
        'scheduledServices.service',
        'scheduledServices.collaborator',
      ],
    });
  }

  /**
   * Retorna os clientIds (do tenant) que têm pelo menos um agendamento
   * futuro ainda ativo (status 'agendado', data >= agora).
   */
  async findClientIdsWithUpcoming(tenantId: string): Promise<string[]> {
    const rows = await this.createQueryBuilder('a')
      .select('DISTINCT a.clientId', 'clientId')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.clientId IS NOT NULL')
      .andWhere('a.status = :status', { status: 'agendado' })
      .andWhere('a.date >= :now', { now: new Date() })
      .getRawMany<{ clientId: string }>();
    return rows.map((r) => r.clientId);
  }
}
