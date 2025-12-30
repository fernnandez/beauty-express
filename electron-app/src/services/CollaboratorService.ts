import { Repository } from 'typeorm';
import { getDataSource } from '../database/database';
import { Collaborator } from '../entities/Collaborator';

export interface CreateCollaboratorDto {
  name: string;
  phone: string;
  area: string;
  commissionPercentage: number;
}

export interface UpdateCollaboratorDto {
  name?: string;
  phone?: string;
  area?: string;
  commissionPercentage?: number;
  isActive?: boolean;
}

export class CollaboratorService {
  private repository: Repository<Collaborator>;

  constructor() {
    this.repository = getDataSource().getRepository(Collaborator);
  }

  async findAll(searchTerm?: string): Promise<Collaborator[]> {
    if (searchTerm && searchTerm.trim()) {
      return await this.repository
        .createQueryBuilder('collaborator')
        .leftJoinAndSelect('collaborator.services', 'services')
        .where('collaborator.name LIKE :search', {
          search: `%${searchTerm.trim()}%`,
        })
        .getMany();
    }
    return await this.repository.find({
      relations: ['services'],
    });
  }

  async findOne(id: string): Promise<Collaborator> {
    const collaborator = await this.repository.findOne({
      where: { id },
      relations: ['services'],
    });

    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    return collaborator;
  }

  async findById(id: string): Promise<Collaborator | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['services'],
    });
  }

  async create(createDto: CreateCollaboratorDto): Promise<Collaborator> {
    console.log('📝 CollaboratorService.create recebeu:', createDto);
    
    // Garante que commissionPercentage é um número
    const commissionPercentage = typeof createDto.commissionPercentage === 'string' 
      ? parseFloat(createDto.commissionPercentage) 
      : createDto.commissionPercentage;

    if (isNaN(commissionPercentage) || commissionPercentage < 0 || commissionPercentage > 100) {
      throw new Error('Commission percentage must be between 0 and 100');
    }

    const collaborator = this.repository.create({
      name: createDto.name,
      phone: createDto.phone,
      area: createDto.area,
      commissionPercentage: commissionPercentage,
      isActive: true,
    });
    
    console.log('💾 Salvando colaborador:', collaborator);
    const saved = await this.repository.save(collaborator);
    console.log('✅ Colaborador salvo com ID:', saved.id);
    return saved;
  }

  async update(
    id: string,
    updateDto: UpdateCollaboratorDto,
  ): Promise<Collaborator> {
    const collaborator = await this.findById(id);
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    if (updateDto.commissionPercentage !== undefined) {
      if (
        updateDto.commissionPercentage < 0 ||
        updateDto.commissionPercentage > 100
      ) {
        throw new Error('Commission percentage must be between 0 and 100');
      }
      collaborator.commissionPercentage = updateDto.commissionPercentage;
    }

    await this.repository.update(id, updateDto);
    return this.findById(id)!;
  }

  async remove(id: string): Promise<void> {
    const collaborator = await this.findById(id);
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }
    await this.repository.delete(id);
  }
}

