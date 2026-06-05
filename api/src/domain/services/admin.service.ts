import { CreateTenantDto } from '@application/dtos/admin/create-tenant.dto';
import { CreateUserDto } from '@application/dtos/admin/create-user.dto';
import { UpdateTenantDto } from '@application/dtos/admin/update-tenant.dto';
import { UpdateUserDto } from '@application/dtos/admin/update-user.dto';
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

    if (dto.slug && dto.slug !== tenant.slug) {
      const slugTaken = await this.tenantRepository.findBySlug(dto.slug);
      if (slugTaken && slugTaken.id !== id) {
        throw new BadRequestException('Slug já está em uso');
      }
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

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    audit: AdminAuditContext,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findByIdWithTenant(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

    if (isSuperAdmin && (dto.role !== undefined || dto.tenantId !== undefined)) {
      throw new BadRequestException(
        'Super admin não pode ter papel ou filial alterados',
      );
    }

    if (!isSuperAdmin && dto.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Não é permitido promover usuário a super admin',
      );
    }

    const targetTenantId =
      dto.tenantId !== undefined ? dto.tenantId : user.tenantId;

    if (!isSuperAdmin && !targetTenantId) {
      throw new BadRequestException('tenantId é obrigatório');
    }

    if (dto.tenantId !== undefined && !isSuperAdmin) {
      const tenant = await this.tenantRepository.findOne({
        where: { id: dto.tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('Filial não encontrada');
      }
    }

    const targetEmail = dto.email ?? user.email;
    if (targetEmail !== user.email) {
      const duplicate = await this.userRepository.findByEmailAndTenant(
        targetEmail,
        isSuperAdmin ? null : targetTenantId,
        id,
      );
      if (duplicate) {
        throw new BadRequestException('E-mail já cadastrado');
      }
    } else if (
      dto.tenantId !== undefined &&
      dto.tenantId !== user.tenantId &&
      !isSuperAdmin
    ) {
      const duplicate = await this.userRepository.findByEmailAndTenant(
        user.email,
        dto.tenantId,
        id,
      );
      if (duplicate) {
        throw new BadRequestException('E-mail já cadastrado nesta filial');
      }
    }

    const updates: Partial<User> = {};

    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.role !== undefined && !isSuperAdmin) updates.role = dto.role;
    if (dto.tenantId !== undefined && !isSuperAdmin) {
      updates.tenantId = dto.tenantId;
    }
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;
    if (dto.password) {
      updates.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }

    await this.userRepository.update(id, updates);
    const updated = await this.userRepository.findByIdWithTenant(id);

    await this.adminAuditService.log(
      audit,
      'user.update',
      'user',
      id,
      {
        email: dto.email,
        role: dto.role,
        tenantId: dto.tenantId,
        isActive: dto.isActive,
        passwordChanged: Boolean(dto.password),
      },
    );

    const { passwordHash: _, ...safeUser } = updated;
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
