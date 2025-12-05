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

  async findById(id: string): Promise<Appointment | null> {
    return await this.findOne({
      where: { id },
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
  ): Promise<Appointment[]> {
    return await this.find({
      where: {
        date: Between(startDate, endDate),
      },
      relations: [
        'scheduledServices',
        'scheduledServices.service',
        'scheduledServices.collaborator',
      ],
    });
  }

  async findByDate(date: Date): Promise<Appointment[]> {
    // Usa funções utilitárias para garantir timezone correto
    const start = startOfDay(date);
    const end = endOfDay(date);

    return await this.find({
      where: {
        date: Between(start, end),
      },
      relations: [
        'scheduledServices',
        'scheduledServices.service',
        'scheduledServices.collaborator',
      ],
    });
  }
}
