import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { TenantRepository } from '../repositories/tenant.repository';
import { PortalRepository } from '../repositories/portal.repository';
import { UserRepository } from '../repositories/user.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { Collaborator } from '../entities/collaborator.entity';
import { Service } from '../entities/service.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Tenant } from '../entities/tenant.entity';
import { ScheduledServiceStatus } from '../entities/scheduled-service.entity';
import { defaultTenantSettings } from './tenant-settings.util';

describe('AdminService', () => {
  let service: AdminService;

  const mockTenant: Tenant = {
    id: 'tenant-1',
    slug: 'paulista',
    name: 'Maria Borboleta — Paulista',
    portalId: 'portal-1',
    settings: defaultTenantSettings('Maria Borboleta — Paulista'),
    isActive: true,
  };

  const mockPortalRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTenantRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findOperationalUser: jest.fn(),
    findByIdWithTenant: jest.fn(),
    findByEmailAndTenant: jest.fn(),
  };

  const mockAdminAuditService = {
    log: jest.fn(),
    listRecent: jest.fn(),
  };

  const mockAppointmentRepository = {
    findByDate: jest.fn(),
    findByDateRange: jest.fn(),
  };

  const mockCommissionRepository = {
    createQueryBuilder: jest.fn(),
    findByFilters: jest.fn(),
  };

  const mockScheduledServiceRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockCollaboratorRepo = {
    count: jest.fn(),
  };

  const mockServiceRepo = {
    count: jest.fn(),
  };

  const mockAppointmentRepo = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: TenantRepository, useValue: mockTenantRepository },
        { provide: PortalRepository, useValue: mockPortalRepository },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AdminAuditService, useValue: mockAdminAuditService },
        {
          provide: AppointmentRepository,
          useValue: mockAppointmentRepository,
        },
        { provide: CommissionRepository, useValue: mockCommissionRepository },
        {
          provide: ScheduledServiceRepository,
          useValue: mockScheduledServiceRepository,
        },
        {
          provide: getRepositoryToken(Collaborator),
          useValue: mockCollaboratorRepo,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepo,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepo,
        },
      ],
    }).compile();

    service = module.get(AdminService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const setupMetricsMocks = (
    tenantMetrics: {
      appointmentsToday?: number;
      revenueThisMonth?: number;
      pendingCommissions?: number;
      collaborators?: number;
      services?: number;
      appointments?: number;
    } = {},
  ) => {
    mockAppointmentRepo.count.mockResolvedValue(tenantMetrics.appointments ?? 5);
    mockCollaboratorRepo.count.mockResolvedValue(tenantMetrics.collaborators ?? 3);
    mockServiceRepo.count.mockResolvedValue(tenantMetrics.services ?? 8);

    mockCommissionRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        total: String(tenantMetrics.pendingCommissions ?? 150.5),
      }),
    });

    const scheduledQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          price: tenantMetrics.revenueThisMonth ?? 100,
          status: ScheduledServiceStatus.COMPLETED,
        },
      ]),
    };
    mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
      scheduledQueryBuilder,
    );
    mockCommissionRepository.findByFilters.mockResolvedValue([]);
  };

  describe('getDashboardStats', () => {
    it('should return consolidated KPIs and breakdown by tenant', async () => {
      const tenantTwo: Tenant = {
        id: 'tenant-2',
        slug: 'recife',
        name: 'Maria Borboleta — Recife',
        portalId: 'portal-1',
        settings: defaultTenantSettings('Maria Borboleta — Recife'),
        isActive: false,
      };

      mockTenantRepository.count.mockResolvedValue(2);
      mockUserRepository.count.mockResolvedValue(4);
      mockCollaboratorRepo.count.mockResolvedValue(6);
      mockServiceRepo.count.mockResolvedValue(10);
      mockAppointmentRepo.count.mockResolvedValue(12);
      mockTenantRepository.find.mockResolvedValue([mockTenant, tenantTwo]);

      const metricsSnapshotSpy = jest
        .spyOn(service, 'getTenantMetricsSnapshot')
        .mockResolvedValueOnce({
          appointmentsToday: 2,
          revenueThisMonth: 100,
          pendingCommissions: 50,
          collaborators: 3,
          services: 4,
          appointments: 6,
        })
        .mockResolvedValueOnce({
          appointmentsToday: 1,
          revenueThisMonth: 80,
          pendingCommissions: 20,
          collaborators: 2,
          services: 3,
          appointments: 4,
        });

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        tenants: 2,
        users: 4,
        collaborators: 6,
        services: 10,
        appointments: 12,
        activeTenants: 1,
        appointmentsToday: 3,
        revenueThisMonth: 180,
        pendingCommissions: 70,
        byTenant: [
          {
            tenantId: 'tenant-1',
            tenantName: 'Maria Borboleta — Paulista',
            slug: 'paulista',
            isActive: true,
            appointmentsToday: 2,
            revenueThisMonth: 100,
            pendingCommissions: 50,
            collaborators: 3,
            services: 4,
          },
          {
            tenantId: 'tenant-2',
            tenantName: 'Maria Borboleta — Recife',
            slug: 'recife',
            isActive: false,
            appointmentsToday: 1,
            revenueThisMonth: 80,
            pendingCommissions: 20,
            collaborators: 2,
            services: 3,
          },
        ],
      });

      expect(metricsSnapshotSpy).toHaveBeenCalledTimes(2);
      metricsSnapshotSpy.mockRestore();
    });
  });

  describe('getTenantDetail', () => {
    it('should throw NotFoundException when tenant does not exist', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getTenantDetail('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return tenant with metrics snapshot', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      setupMetricsMocks();

      const result = await service.getTenantDetail('tenant-1');

      expect(result.id).toBe('tenant-1');
      expect(result.metrics).toEqual(
        expect.objectContaining({
          appointmentsToday: expect.any(Number),
          revenueThisMonth: 100,
          pendingCommissions: 150.5,
          collaborators: 3,
          services: 8,
          appointments: 5,
        }),
      );
    });
  });

  describe('getTenantAppointments', () => {
    it('should throw NotFoundException when tenant does not exist', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getTenantAppointments('missing-id', { date: '2026-06-15' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fetch appointments by date', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      const appointments = [{ id: 'appt-1', status: AppointmentStatus.SCHEDULED }];
      mockAppointmentRepository.findByDate.mockResolvedValue(appointments);

      const result = await service.getTenantAppointments('tenant-1', {
        date: '2026-06-15',
      });

      expect(mockAppointmentRepository.findByDate).toHaveBeenCalled();
      expect(result).toEqual(appointments);
    });
  });

  describe('getTenantSummary', () => {
    it('should throw NotFoundException when tenant does not exist', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getTenantSummary('missing-id', 2026, 6),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return monthly financial report', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);

      const scheduledQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            price: 80,
            status: ScheduledServiceStatus.COMPLETED,
          },
          {
            price: 20,
            status: ScheduledServiceStatus.PENDING,
          },
        ]),
      };
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        scheduledQueryBuilder,
      );
      mockCommissionRepository.findByFilters.mockResolvedValue([]);

      const result = await service.getTenantSummary('tenant-1', 2026, 6);

      expect(result.totalPaid).toBe(80);
      expect(result.totalUnpaid).toBe(20);
      expect(result.totalScheduled).toBe(100);
      expect(result.period.startDate).toBeDefined();
      expect(result.period.endDate).toBeDefined();
    });
  });
});
