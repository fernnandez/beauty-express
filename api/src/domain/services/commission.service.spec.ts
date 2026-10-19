import { Test, TestingModule } from '@nestjs/testing';
import { Commission } from '../entities/commission.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { CommissionService } from './commission.service';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { TenantContextService } from './tenant-context.service';
import {
  mockTenantContextService,
  mockTenantSettingsService,
} from '../../test/tenant-context.mock';
import { TenantSettingsService } from './tenant-settings.service';

describe('CommissionService', () => {
  let service: CommissionService;
  let mockQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    getMany: jest.Mock;
  };

  const mockCommissionRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByScheduledServiceId: jest.fn(),
    findByFilters: jest.fn(),
    findPaginated: jest.fn(),
    getCollaboratorSummary: jest.fn(),
    findManyByIds: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    findUnpaidWithServiceDate: jest.fn(),
  };

  const mockScheduledServiceRepository = {
    findById: jest.fn(),
    findByAppointmentId: jest.fn(),
  };

  beforeEach(async () => {
    // Cria o mock do QueryBuilder antes de cada teste
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    mockCommissionRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: CommissionRepository,
          useValue: mockCommissionRepository,
        },
        {
          provide: ScheduledServiceRepository,
          useValue: mockScheduledServiceRepository,
        },
        {
          provide: TenantSettingsService,
          useValue: mockTenantSettingsService,
        },
      ],
    }).compile();

    service = await module.resolve<CommissionService>(CommissionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCollaboratorAlerts', () => {
    const dateISO = (iso: string) => new Date(`${iso}T00:00:00-03:00`);

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(dateISO('2026-10-17'));
      (mockTenantSettingsService.getFeatures as jest.Mock).mockResolvedValue({
        commissionsEnabled: true,
        financialReportsMode: 'full',
        periodMode: 'biweekly',
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('classifica atrasado e pendente por colaborador (quinzenal 15/31)', async () => {
      mockCommissionRepository.findUnpaidWithServiceDate.mockResolvedValue([
        // col-1: serviço 05/10 vence 15/10 -> hoje 17/10 => ATRASADO
        {
          collaboratorId: 'col-1',
          amount: 100,
          serviceDate: dateISO('2026-10-05'),
        },
        // col-1: serviço 16/10 vence 31/10 -> hoje 17/10 => PENDENTE
        {
          collaboratorId: 'col-1',
          amount: 50,
          serviceDate: dateISO('2026-10-16'),
        },
        // col-2: serviço 20/10 vence 31/10 -> PENDENTE
        {
          collaboratorId: 'col-2',
          amount: 30,
          serviceDate: dateISO('2026-10-20'),
        },
      ]);

      const alerts = await service.getCollaboratorAlerts();
      const byId = Object.fromEntries(alerts.map((a) => [a.collaboratorId, a]));

      expect(byId['col-1'].status).toBe('overdue');
      expect(byId['col-1'].overdueAmount).toBe(100);
      expect(byId['col-1'].overdueCount).toBe(1);
      expect(byId['col-1'].pendingAmount).toBe(50);
      expect(byId['col-1'].pendingCount).toBe(1);

      expect(byId['col-2'].status).toBe('pending');
      expect(byId['col-2'].overdueCount).toBe(0);
      expect(byId['col-2'].pendingAmount).toBe(30);
    });

    it('modo mensal: só vence no fim do mês', async () => {
      (mockTenantSettingsService.getFeatures as jest.Mock).mockResolvedValue({
        commissionsEnabled: true,
        financialReportsMode: 'full',
        periodMode: 'monthly',
      });

      mockCommissionRepository.findUnpaidWithServiceDate.mockResolvedValue([
        // serviço 05/10 vence 31/10 -> hoje 17/10 => PENDENTE (não atrasa no mensal)
        {
          collaboratorId: 'col-1',
          amount: 100,
          serviceDate: dateISO('2026-10-05'),
        },
        // serviço 05/09 vence 30/09 -> hoje 17/10 => ATRASADO
        {
          collaboratorId: 'col-1',
          amount: 70,
          serviceDate: dateISO('2026-09-05'),
        },
      ]);

      const alerts = await service.getCollaboratorAlerts();
      expect(alerts[0].status).toBe('overdue');
      expect(alerts[0].overdueAmount).toBe(70);
      expect(alerts[0].pendingAmount).toBe(100);
    });

    it('sem comissões não pagas retorna lista vazia', async () => {
      mockCommissionRepository.findUnpaidWithServiceDate.mockResolvedValue([]);
      expect(await service.getCollaboratorAlerts()).toEqual([]);
    });
  });

  describe('calculateCommission', () => {
    const mockScheduledService: ScheduledService = {
      id: 'scheduled-1',
      tenantId: TENANT_ID_MOCK,
      appointmentId: 'appointment-1',
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 100.0,
      status: ScheduledServiceStatus.COMPLETED,
      service: {
        id: 'service-1',
        tenantId: TENANT_ID_MOCK,
        name: 'Corte de Cabelo',
        defaultPrice: 100.0,
        commissionPercentage: 10,
        collaborators: [],
      },
    } as ScheduledService;

    const expectedCommission: Commission = {
      id: 'commission-1',
      tenantId: TENANT_ID_MOCK,
      collaboratorId: 'collaborator-1',
      scheduledServiceId: 'scheduled-1',
      amount: 10.0, // 10% de 100
      percentage: 10,
      paid: false,
    };

    it('should calculate commission for completed scheduled service with collaborator', async () => {
      mockScheduledServiceRepository.findById.mockResolvedValue(
        mockScheduledService,
      );
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(null);
      mockCommissionRepository.save.mockResolvedValue(expectedCommission);

      const result = await service.calculateCommission('scheduled-1');

      expect(result).toEqual(expectedCommission);
      expect(result!.amount).toBe(10.0);
      expect(result!.percentage).toBe(10);
      expect(mockCommissionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          collaboratorId: 'collaborator-1',
          scheduledServiceId: 'scheduled-1',
          amount: 10.0,
          percentage: 10,
          paid: false,
        }),
      );
    });

    it('should throw error when scheduled service not found', async () => {
      mockScheduledServiceRepository.findById.mockResolvedValue(null);

      await expect(
        service.calculateCommission('non-existent-id'),
      ).rejects.toThrow('ScheduledService not found');
    });

    it('should throw error when scheduled service is not completed', async () => {
      const pendingService: ScheduledService = {
        ...mockScheduledService,
        status: ScheduledServiceStatus.PENDING,
      };

      mockScheduledServiceRepository.findById.mockResolvedValue(pendingService);

      await expect(service.calculateCommission('scheduled-1')).rejects.toThrow(
        'Can only calculate commission for completed scheduled services',
      );
    });

    it('should throw error when scheduled service has no collaborator', async () => {
      const serviceWithoutCollaborator: ScheduledService = {
        ...mockScheduledService,
        collaboratorId: undefined,
      };

      mockScheduledServiceRepository.findById.mockResolvedValue(
        serviceWithoutCollaborator,
      );

      await expect(service.calculateCommission('scheduled-1')).rejects.toThrow(
        'ScheduledService has no assigned collaborator',
      );
    });

    it('should update existing commission when recalculating', async () => {
      const existingCommission: Commission = {
        id: 'commission-1',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-1',
        amount: 5.0, // valor antigo
        percentage: 10,
        paid: false,
      };

      const updatedCommission: Commission = {
        ...existingCommission,
        amount: 10.0, // novo valor
      };

      mockScheduledServiceRepository.findById.mockResolvedValue(
        mockScheduledService,
      );
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(
        existingCommission,
      );
      mockCommissionRepository.findById.mockResolvedValue(updatedCommission);
      mockCommissionRepository.update.mockResolvedValue(undefined);

      const result = await service.calculateCommission('scheduled-1');

      expect(result).toEqual(updatedCommission);
      expect(mockCommissionRepository.update).toHaveBeenCalledWith(
        { id: existingCommission.id, tenantId: TENANT_ID_MOCK },
        {
          amount: 10.0,
          percentage: 10,
        },
      );
    });

    it('should calculate commission with different percentage', async () => {
      const scheduledServiceWithDifferentPercentage: ScheduledService = {
        ...mockScheduledService,
        service: {
          ...mockScheduledService.service!,
          commissionPercentage: 15,
        },
      };

      const expectedCommission: Commission = {
        id: 'commission-1',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-1',
        amount: 15.0, // 15% de 100
        percentage: 15,
        paid: false,
      };

      mockScheduledServiceRepository.findById.mockResolvedValue(
        scheduledServiceWithDifferentPercentage,
      );
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(null);
      mockCommissionRepository.save.mockResolvedValue(expectedCommission);

      const result = await service.calculateCommission('scheduled-1');

      expect(result!.amount).toBe(15.0);
      expect(result!.percentage).toBe(15);
    });
  });

  describe('calculateCommissionsForAppointment', () => {
    const completedService: ScheduledService = {
      id: 'scheduled-1',
      tenantId: TENANT_ID_MOCK,
      appointmentId: 'appointment-1',
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 100.0,
      status: ScheduledServiceStatus.COMPLETED,
      service: {
        id: 'service-1',
        tenantId: TENANT_ID_MOCK,
        name: 'Corte de Cabelo',
        defaultPrice: 100.0,
        commissionPercentage: 10,
        collaborators: [],
      },
    } as ScheduledService;

    const pendingService: ScheduledService = {
      id: 'scheduled-2',
      tenantId: TENANT_ID_MOCK,
      appointmentId: 'appointment-1',
      serviceId: 'service-2',
      collaboratorId: 'collaborator-1',
      price: 50.0,
      status: ScheduledServiceStatus.PENDING,
    } as ScheduledService;

    it('should calculate commissions only for completed services', async () => {
      const scheduledServices = [completedService, pendingService];
      const expectedCommission: Commission = {
        id: 'commission-1',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-1',
        amount: 10.0,
        percentage: 10,
        paid: false,
      };

      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        scheduledServices,
      );
      mockScheduledServiceRepository.findById.mockResolvedValue(
        completedService,
      );
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(null);
      mockCommissionRepository.save.mockResolvedValue(expectedCommission);

      const result =
        await service.calculateCommissionsForAppointment('appointment-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedCommission);
      expect(mockScheduledServiceRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockScheduledServiceRepository.findById).toHaveBeenCalledWith(
        'scheduled-1',
        TENANT_ID_MOCK,
      );
    });

    it('should skip services that already have commissions', async () => {
      const scheduledServices = [completedService];
      const existingCommission: Commission = {
        id: 'commission-1',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-1',
        amount: 10.0,
        percentage: 10,
        paid: false,
      };

      mockScheduledServiceRepository.findByAppointmentId.mockResolvedValue(
        scheduledServices,
      );
      mockScheduledServiceRepository.findById.mockResolvedValue(
        completedService,
      );
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(
        existingCommission,
      );
      mockCommissionRepository.findById.mockResolvedValue(existingCommission);

      const result =
        await service.calculateCommissionsForAppointment('appointment-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(existingCommission);
    });
  });

  describe('findAll', () => {
    const mockListResult = {
      items: [
        {
          id: 'commission-1',
          tenantId: TENANT_ID_MOCK,
          collaboratorId: 'collaborator-1',
          scheduledServiceId: 'scheduled-1',
          amount: 10.0,
          percentage: 10,
          paid: false,
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      summary: {
        totalAmount: 10,
        pendingAmount: 10,
        paidAmount: 0,
      },
    };

    it('should return paginated commissions when no filters', async () => {
      mockCommissionRepository.findPaginated.mockResolvedValue(mockListResult);

      const result = await service.findAll();

      expect(result).toEqual(mockListResult);
      expect(mockCommissionRepository.findPaginated).toHaveBeenCalledWith(
        TENANT_ID_MOCK,
        {},
        1,
        50,
      );
    });

    it('should filter by paid status', async () => {
      mockCommissionRepository.findPaginated.mockResolvedValue(mockListResult);

      const result = await service.findAll({ paid: true });

      expect(result).toEqual(mockListResult);
      expect(mockCommissionRepository.findPaginated).toHaveBeenCalledWith(
        TENANT_ID_MOCK,
        { paid: true },
        1,
        50,
      );
    });

    it('should filter by collaborator', async () => {
      mockCommissionRepository.findPaginated.mockResolvedValue(mockListResult);

      const result = await service.findAll({
        collaboratorIds: ['collaborator-1'],
      });

      expect(result).toEqual(mockListResult);
      expect(mockCommissionRepository.findPaginated).toHaveBeenCalledWith(
        TENANT_ID_MOCK,
        { collaboratorIds: ['collaborator-1'] },
        1,
        50,
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      mockCommissionRepository.findPaginated.mockResolvedValue(mockListResult);

      const result = await service.findAll({ startDate, endDate });

      expect(result).toEqual(mockListResult);
      expect(mockCommissionRepository.findPaginated).toHaveBeenCalledWith(
        TENANT_ID_MOCK,
        { startDate, endDate },
        1,
        50,
      );
    });

    it('should pass custom pagination params', async () => {
      mockCommissionRepository.findPaginated.mockResolvedValue(mockListResult);

      await service.findAll(undefined, 2, 25);

      expect(mockCommissionRepository.findPaginated).toHaveBeenCalledWith(
        TENANT_ID_MOCK,
        {},
        2,
        25,
      );
    });
  });
  describe('getCollaboratorSummary', () => {
    const mockSummary = {
      servicesCount: 3,
      totalAmount: 120,
      pendingAmount: 70,
      paidAmount: 50,
      uniqueClients: 2,
    };

    it('should return the collaborator summary with tenant from context', async () => {
      mockCommissionRepository.getCollaboratorSummary.mockResolvedValue(
        mockSummary,
      );

      const result = await service.getCollaboratorSummary('collaborator-1');

      expect(result).toEqual(mockSummary);
      expect(
        mockCommissionRepository.getCollaboratorSummary,
      ).toHaveBeenCalledWith(TENANT_ID_MOCK, 'collaborator-1', {});
    });

    it('should forward filters to the repository', async () => {
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      mockCommissionRepository.getCollaboratorSummary.mockResolvedValue(
        mockSummary,
      );

      await service.getCollaboratorSummary('collaborator-1', {
        paid: false,
        startDate,
        endDate,
      });

      expect(
        mockCommissionRepository.getCollaboratorSummary,
      ).toHaveBeenCalledWith(TENANT_ID_MOCK, 'collaborator-1', {
        paid: false,
        startDate,
        endDate,
      });
    });
  });

  describe('markAsPaid', () => {
    const mockCommissions: Commission[] = [
      {
        id: 'commission-1',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-1',
        amount: 10.0,
        percentage: 10,
        paid: false,
      },
      {
        id: 'commission-2',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-2',
        scheduledServiceId: 'scheduled-2',
        amount: 15.0,
        percentage: 15,
        paid: false,
      },
    ];

    const paidCommissions: Commission[] = mockCommissions.map((c) => ({
      ...c,
      paid: true,
    }));

    it('should mark multiple commissions as paid', async () => {
      const commissionIds = ['commission-1', 'commission-2'];

      mockCommissionRepository.findManyByIds.mockResolvedValueOnce(
        mockCommissions,
      );
      mockCommissionRepository.update.mockResolvedValue(undefined);
      mockCommissionRepository.findManyByIds.mockResolvedValueOnce(
        paidCommissions,
      );

      const result = await service.markAsPaid(commissionIds);

      expect(result).toEqual(paidCommissions);
      expect(result.every((c) => c.paid)).toBe(true);
      expect(mockCommissionRepository.update).toHaveBeenCalled();
    });

    it('should throw error when some commissions not found', async () => {
      const commissionIds = ['commission-1', 'non-existent'];
      const foundCommissions = [mockCommissions[0]];

      mockCommissionRepository.findManyByIds.mockResolvedValue(
        foundCommissions,
      );

      await expect(service.markAsPaid(commissionIds)).rejects.toThrow(
        'Some commissions were not found',
      );
    });
  });

  describe('markAsUnpaid', () => {
    const paidCommissions: Commission[] = [
      {
        id: 'commission-1',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-1',
        amount: 10.0,
        percentage: 10,
        paid: true,
      },
    ];

    const unpaidCommissions: Commission[] = paidCommissions.map((c) => ({
      ...c,
      paid: false,
    }));

    it('should mark commissions as unpaid', async () => {
      const commissionIds = ['commission-1'];

      mockCommissionRepository.findManyByIds.mockResolvedValueOnce(
        paidCommissions,
      );
      mockCommissionRepository.update.mockResolvedValue(undefined);
      mockCommissionRepository.findManyByIds.mockResolvedValueOnce(
        unpaidCommissions,
      );

      const result = await service.markAsUnpaid(commissionIds);

      expect(result).toEqual(unpaidCommissions);
      expect(result.every((c) => !c.paid)).toBe(true);
    });
  });
});
