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
import { AppointmentRepository } from '@domain/repositories/appointment.repository';
import { CommissionRepository } from '@domain/repositories/commission.repository';
import { ScheduledServiceRepository } from '@domain/repositories/scheduled-service.repository';
import { TenantRepository } from '@domain/repositories/tenant.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { WhatsappInstanceRepository } from '@domain/repositories/whatsapp-instance.repository';
import { WhatsappInstanceStatus } from '@domain/entities/whatsapp-enums';
import { AdminAuditContext, AdminAuditService } from './admin-audit.service';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { Service } from '@domain/entities/service.entity';
import {
  Appointment,
  AppointmentStatus,
} from '@domain/entities/appointment.entity';
import { Commission } from '@domain/entities/commission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { endOfDay, parseDateString } from '../../utils/date.util';
import {
  buildTenantFinancialReport,
  getMonthPeriod,
  TenantFinancialReport,
} from './tenant-financial-report.util';
import {
  defaultTenantSettings,
  mergeTenantSettingsForSave,
  normalizeTenantSettings,
} from './tenant-settings.util';

export interface TenantMetricsSnapshot {
  appointmentsToday: number;
  revenueThisMonth: number;
  pendingCommissions: number;
  collaborators: number;
  services: number;
  appointments: number;
}

export interface TenantDashboardRow {
  tenantId: string;
  tenantName: string;
  slug: string;
  isActive: boolean;
  appointmentsToday: number;
  revenueThisMonth: number;
  pendingCommissions: number;
  collaborators: number;
  services: number;
  users: number;
  whatsappStatus: WhatsappInstanceStatus | 'none';
  lastActivityAt: string | null;
}

export interface DashboardStats {
  tenants: number;
  users: number;
  collaborators: number;
  services: number;
  appointments: number;
  activeTenants: number;
  appointmentsToday: number;
  revenueThisMonth: number;
  pendingCommissions: number;
  byTenant: TenantDashboardRow[];
}

export interface TenantCollaboratorRow {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  servicesCount: number;
  hasOwnProfile: boolean;
  profileActive: boolean;
}

export interface TenantCollaboratorsReport {
  commissionsEnabled: boolean;
  periodMode: 'biweekly' | 'monthly';
  total: number;
  active: number;
  withProfile: number;
  collaborators: TenantCollaboratorRow[];
}

export interface TenantDetail extends Tenant {
  metrics: TenantMetricsSnapshot;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly adminAuditService: AdminAuditService,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly commissionRepository: CommissionRepository,
    private readonly scheduledServiceRepository: ScheduledServiceRepository,
    private readonly whatsappInstanceRepository: WhatsappInstanceRepository,
    @InjectRepository(Collaborator)
    private readonly collaboratorRepo: Repository<Collaborator>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async listTenants(): Promise<Tenant[]> {
    return await this.tenantRepository.find({
      order: { name: 'ASC' },
    });
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
      settings: defaultTenantSettings(dto.name),
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
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });
    if (!tenant) {
      throw new NotFoundException('Filial não encontrada');
    }

    if (dto.slug && dto.slug !== tenant.slug) {
      const slugTaken = await this.tenantRepository.findBySlug(dto.slug);
      if (slugTaken && slugTaken.id !== id) {
        throw new BadRequestException('Slug já está em uso');
      }
    }

    const updates: Partial<Tenant> = {};

    if (dto.name !== undefined) {
      updates.name = dto.name;
    }
    if (dto.slug !== undefined) {
      updates.slug = dto.slug;
    }
    if (dto.isActive !== undefined) {
      updates.isActive = dto.isActive;
    }
    if (dto.settings !== undefined) {
      updates.settings = mergeTenantSettingsForSave(
        tenant.settings,
        dto.settings,
        dto.name ?? tenant.name,
      );
    }

    await this.tenantRepository.update(id, updates);
    const updated = await this.tenantRepository.findOne({
      where: { id },
    });
    if (!updated) {
      throw new NotFoundException('Filial não encontrada');
    }

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

    await this.adminAuditService.log(audit, 'user.create', 'user', user.id, {
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

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

    if (
      isSuperAdmin &&
      (dto.role !== undefined || dto.tenantId !== undefined)
    ) {
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
    if (!updated) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.adminAuditService.log(audit, 'user.update', 'user', id, {
      email: dto.email,
      role: dto.role,
      tenantId: dto.tenantId,
      isActive: dto.isActive,
      passwordChanged: Boolean(dto.password),
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async listAuditLogs(limit = 50) {
    return await this.adminAuditService.listRecent(limit);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [tenants, users, collaborators, services, appointments, allTenants] =
      await Promise.all([
        this.tenantRepository.count(),
        this.userRepository.count(),
        this.collaboratorRepo.count(),
        this.serviceRepo.count(),
        this.appointmentRepo.count(),
        this.tenantRepository.find({ order: { name: 'ASC' } }),
      ]);

    const byTenant = await Promise.all(
      allTenants.map(async (tenant) => {
        const [metrics, userCount, whatsappStatus, lastActivityAt] =
          await Promise.all([
            this.getTenantMetricsSnapshot(tenant.id),
            this.userRepository.count({ where: { tenantId: tenant.id } }),
            this.getWhatsappStatus(tenant.id),
            this.getLastActivityAt(tenant.id),
          ]);
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          slug: tenant.slug,
          isActive: tenant.isActive,
          appointmentsToday: metrics.appointmentsToday,
          revenueThisMonth: metrics.revenueThisMonth,
          pendingCommissions: metrics.pendingCommissions,
          collaborators: metrics.collaborators,
          services: metrics.services,
          users: userCount,
          whatsappStatus,
          lastActivityAt,
        };
      }),
    );

    return {
      tenants,
      users,
      collaborators,
      services,
      appointments,
      activeTenants: allTenants.filter((tenant) => tenant.isActive).length,
      appointmentsToday: byTenant.reduce(
        (sum, row) => sum + row.appointmentsToday,
        0,
      ),
      revenueThisMonth: byTenant.reduce(
        (sum, row) => sum + row.revenueThisMonth,
        0,
      ),
      pendingCommissions: byTenant.reduce(
        (sum, row) => sum + row.pendingCommissions,
        0,
      ),
      byTenant,
    };
  }

  private async resolveTenantOrThrow(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });
    if (!tenant) {
      throw new NotFoundException('Filial não encontrada');
    }
    return tenant;
  }

  private getTodayBounds() {
    const today = DateTime.now().setZone('America/Sao_Paulo').startOf('day');
    return {
      start: today.toJSDate(),
      end: today.endOf('day').toJSDate(),
    };
  }

  async countAppointmentsToday(tenantId: string): Promise<number> {
    const { start, end } = this.getTodayBounds();
    return await this.appointmentRepo.count({
      where: {
        tenantId,
        date: Between(start, end),
        status: Not(AppointmentStatus.CANCELLED),
      },
    });
  }

  /** Status da instância de WhatsApp da filial ('none' se não configurada). */
  async getWhatsappStatus(
    tenantId: string,
  ): Promise<WhatsappInstanceStatus | 'none'> {
    const instance =
      await this.whatsappInstanceRepository.findByTenant(tenantId);
    return (instance?.status as WhatsappInstanceStatus) ?? 'none';
  }

  /** Data do agendamento mais recente da filial (proxy de última atividade). */
  async getLastActivityAt(tenantId: string): Promise<string | null> {
    const latest = await this.appointmentRepo.findOne({
      where: { tenantId },
      order: { date: 'DESC' },
      select: { id: true, date: true },
    });
    return latest?.date ? latest.date.toISOString() : null;
  }

  async getPendingCommissionsSum(tenantId: string): Promise<number> {
    const result = await this.commissionRepository
      .createQueryBuilder('commission')
      .select('COALESCE(SUM(commission.amount), 0)', 'total')
      .where('commission.tenantId = :tenantId', { tenantId })
      .andWhere('commission.paid = :paid', { paid: false })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  async getMonthlyFinancialReport(
    tenantId: string,
    year: number,
    month: number,
  ): Promise<TenantFinancialReport> {
    const { start, end } = getMonthPeriod(year, month);

    const scheduledServices = await this.scheduledServiceRepository
      .createQueryBuilder('scheduledService')
      .leftJoinAndSelect('scheduledService.appointment', 'appointment')
      .where('scheduledService.tenantId = :tenantId', { tenantId })
      .andWhere('appointment.date BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      })
      .getMany();

    const paidCommissions = await this.commissionRepository.findByFilters(
      tenantId,
      {
        paid: true,
        startDate: start,
        endDate: end,
      },
    );

    const allCommissions = await this.commissionRepository.findByFilters(
      tenantId,
      {
        startDate: start,
        endDate: end,
      },
    );

    return buildTenantFinancialReport(
      scheduledServices,
      paidCommissions,
      allCommissions,
      start,
      end,
    );
  }

  async getTenantMetricsSnapshot(
    tenantId: string,
  ): Promise<TenantMetricsSnapshot> {
    const now = DateTime.now().setZone('America/Sao_Paulo');

    const [
      appointmentsToday,
      pendingCommissions,
      collaborators,
      services,
      appointments,
      monthlyReport,
    ] = await Promise.all([
      this.countAppointmentsToday(tenantId),
      this.getPendingCommissionsSum(tenantId),
      this.collaboratorRepo.count({ where: { tenantId } }),
      this.serviceRepo.count({ where: { tenantId } }),
      this.appointmentRepo.count({ where: { tenantId } }),
      this.getMonthlyFinancialReport(tenantId, now.year, now.month),
    ]);

    return {
      appointmentsToday,
      revenueThisMonth: monthlyReport.totalPaid,
      pendingCommissions,
      collaborators,
      services,
      appointments,
    };
  }

  async getTenantDetail(id: string): Promise<TenantDetail> {
    const tenant = await this.resolveTenantOrThrow(id);
    const metrics = await this.getTenantMetricsSnapshot(id);
    return { ...tenant, metrics };
  }

  /**
   * Descritivo de colaboradores da filial: lista com serviços associados,
   * indicação de perfil próprio (login) e o regime de comissões da filial.
   */
  async getTenantCollaborators(
    tenantId: string,
  ): Promise<TenantCollaboratorsReport> {
    const tenant = await this.resolveTenantOrThrow(tenantId);
    const features = normalizeTenantSettings(tenant.settings, tenant.name)
      .features;

    const collaborators = await this.collaboratorRepo.find({
      where: { tenantId },
      relations: { services: true },
      order: { name: 'ASC' },
    });

    // Usuários (perfil próprio) vinculados a esses colaboradores.
    const collaboratorIds = collaborators.map((c) => c.id);
    const profileUsers = collaboratorIds.length
      ? await this.userRepository.find({
          where: { collaboratorId: In(collaboratorIds) },
        })
      : [];
    const profileByCollaborator = new Map(
      profileUsers.map((u) => [u.collaboratorId as string, u]),
    );

    const rows: TenantCollaboratorRow[] = collaborators.map((c) => {
      const profile = profileByCollaborator.get(c.id);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        isActive: c.isActive,
        servicesCount: c.services?.length ?? 0,
        hasOwnProfile: Boolean(profile),
        profileActive: Boolean(profile?.isActive),
      };
    });

    return {
      commissionsEnabled: features.commissionsEnabled,
      periodMode: features.periodMode === 'monthly' ? 'monthly' : 'biweekly',
      total: rows.length,
      active: rows.filter((r) => r.isActive).length,
      withProfile: rows.filter((r) => r.hasOwnProfile).length,
      collaborators: rows,
    };
  }

  async getTenantAppointments(
    tenantId: string,
    filters: {
      date?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Appointment[]> {
    await this.resolveTenantOrThrow(tenantId);

    if (filters.startDate && filters.endDate) {
      return await this.appointmentRepository.findByDateRange(
        parseDateString(filters.startDate),
        endOfDay(filters.endDate),
        tenantId,
      );
    }

    const dateString =
      filters.date ??
      DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd');
    return await this.appointmentRepository.findByDate(
      parseDateString(dateString),
      tenantId,
    );
  }

  async getTenantCommissions(
    tenantId: string,
    filters: {
      paid?: boolean;
      startDate?: Date;
      endDate?: Date;
      collaboratorId?: string;
    },
  ): Promise<Commission[]> {
    await this.resolveTenantOrThrow(tenantId);

    if (Object.keys(filters).length === 0) {
      return await this.commissionRepository.findByFilters(tenantId, {});
    }

    return await this.commissionRepository.findByFilters(tenantId, filters);
  }

  async getTenantSummary(
    tenantId: string,
    year: number,
    month: number,
  ): Promise<TenantFinancialReport> {
    await this.resolveTenantOrThrow(tenantId);
    return await this.getMonthlyFinancialReport(tenantId, year, month);
  }
}
