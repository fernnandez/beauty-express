import { CreateTenantDto } from '@application/dtos/admin/create-tenant.dto';
import { CreateUserDto } from '@application/dtos/admin/create-user.dto';
import { UpdateTenantDto } from '@application/dtos/admin/update-tenant.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@domain/entities/user-role.enum';
import { Tenant } from '@domain/entities/tenant.entity';
import { User } from '@domain/entities/user.entity';
import { TenantRepository } from '@domain/repositories/tenant.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  AdminAuditContext,
  AdminAuditService,
} from './admin-audit.service';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { Service } from '@domain/entities/service.entity';
import { Appointment } from '@domain/entities/appointment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly adminAuditService: AdminAuditService,
    @InjectRepository(Collaborator)
    private readonly collaboratorRepo: Repository<Collaborator>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async listTenants(): Promise<Tenant[]> {
    return await this.tenantRepository.find({ order: { name: 'ASC' } });
  }

  async createTenant(
    dto: CreateTenantDto,
    audit: AdminAuditContext,
  ): Promise<Tenant> {
    const existing = await this.tenantRepository.findBySlug(dto.slug);
    if (existing) {
      throw new BadRequestException('Slug já está em uso');
    }

    const tenant = await this.tenantRepository.save({
      slug: dto.slug,
      name: dto.name,
      isActive: dto.isActive ?? true,
    });

    await this.adminAuditService.log(
      audit,
      'tenant.create',
      'tenant',
      tenant.id,
      { slug: tenant.slug, name: tenant.name },
    );

    return tenant;
  }

  async updateTenant(
    id: string,
    dto: UpdateTenantDto,
    audit: AdminAuditContext,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Filial não encontrada');
    }

    await this.tenantRepository.update(id, dto);
    const updated = await this.tenantRepository.findOne({ where: { id } });

    await this.adminAuditService.log(
      audit,
      'tenant.update',
      'tenant',
      id,
      dto as Record<string, unknown>,
    );

    return updated;
  }

  async listUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.find({
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });

    return users.map(({ passwordHash: _, ...user }) => user);
  }

  async createUser(
    dto: CreateUserDto,
    audit: AdminAuditContext,
  ): Promise<Omit<User, 'passwordHash'>> {
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Super admin deve ser criado manualmente no banco',
      );
    }

    if (!dto.tenantId) {
      throw new BadRequestException('tenantId é obrigatório');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: dto.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Filial não encontrada');
    }

    const existing = await this.userRepository.findOperationalUser(
      dto.email,
      dto.tenantId,
    );
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado nesta filial');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.save({
      email: dto.email,
      passwordHash,
      role: dto.role,
      tenantId: dto.tenantId,
      isActive: true,
    });

    await this.adminAuditService.log(
      audit,
      'user.create',
      'user',
      user.id,
      { email: user.email, role: user.role, tenantId: user.tenantId },
    );

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async listAuditLogs(limit = 50) {
    return await this.adminAuditService.listRecent(limit);
  }

  async getDashboardStats() {
    const [tenants, users, collaborators, services, appointments] =
      await Promise.all([
        this.tenantRepository.count(),
        this.userRepository.count(),
        this.collaboratorRepo.count(),
        this.serviceRepo.count(),
        this.appointmentRepo.count(),
      ]);

    return {
      tenants,
      users,
      collaborators,
      services,
      appointments,
    };
  }
}
