import { Test, TestingModule } from '@nestjs/testing';
import { Collaborator } from '../entities/collaborator.entity';
import { Commission } from '../entities/commission.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { CommissionService } from './commission.service';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { TenantContextService } from './tenant-context.service';
import { mockTenantContextService, mockTenantSettingsService } from '../../test/tenant-context.mock';
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
    findManyByIds: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockScheduledServiceRepository = {
    findById: jest.fn(),
    findByAppointmentId: jest.fn(),
  };

  const mockCollaboratorRepository = {
    findById: jest.fn(),
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
          provide: CollaboratorRepository,
          useValue: mockCollaboratorRepository,
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

  describe('calculateCommission', () => {
    const mockCollaborator: Collaborator = {
      id: 'collaborator-1',
      tenantId: TENANT_ID_MOCK,
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
      isActive: true,
      services: [],
    };

    const mockScheduledService: ScheduledService = {
      id: 'scheduled-1',
        tenantId: TENANT_ID_MOCK,
      appointmentId: 'appointment-1',
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 100.0,
      status: ScheduledServiceStatus.COMPLETED,
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
      mockCollaboratorRepository.findById.mockResolvedValue(mockCollaborator);
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(null);
      mockCommissionRepository.save.mockResolvedValue(expectedCommission);

      const result = await service.calculateCommission('scheduled-1');

      expect(result).toEqual(expectedCommission);
      expect(result.amount).toBe(10.0);
      expect(result.percentage).toBe(10);
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

    it('should throw error when collaborator not found', async () => {
      mockScheduledServiceRepository.findById.mockResolvedValue(
        mockScheduledService,
      );
      mockCollaboratorRepository.findById.mockResolvedValue(null);

      await expect(service.calculateCommission('scheduled-1')).rejects.toThrow(
        'Collaborator not found',
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
      mockCollaboratorRepository.findById.mockResolvedValue(mockCollaborator);
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
      const collaboratorWithDifferentPercentage: Collaborator = {
        ...mockCollaborator,
        commissionPercentage: 15,
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
        mockScheduledService,
      );
      mockCollaboratorRepository.findById.mockResolvedValue(
        collaboratorWithDifferentPercentage,
      );
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(null);
      mockCommissionRepository.save.mockResolvedValue(expectedCommission);

      const result = await service.calculateCommission('scheduled-1');

      expect(result.amount).toBe(15.0);
      expect(result.percentage).toBe(15);
    });
  });

  describe('calculateCommissionsForAppointment', () => {
    const mockCollaborator: Collaborator = {
      id: 'collaborator-1',
      tenantId: TENANT_ID_MOCK,
      name: 'João Silva',
      phone: '11999999999',
      area: 'Cabeleireiro',
      commissionPercentage: 10,
      isActive: true,
      services: [],
    };

    const completedService: ScheduledService = {
      id: 'scheduled-1',
        tenantId: TENANT_ID_MOCK,
      appointmentId: 'appointment-1',
      serviceId: 'service-1',
      collaboratorId: 'collaborator-1',
      price: 100.0,
      status: ScheduledServiceStatus.COMPLETED,
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
      mockCollaboratorRepository.findById.mockResolvedValue(mockCollaborator);
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
      mockCollaboratorRepository.findById.mockResolvedValue(mockCollaborator);
      mockCommissionRepository.findByScheduledServiceId.mockResolvedValue(
        existingCommission,
      );

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

      mockCommissionRepository.findManyByIds.mockResolvedValueOnce(mockCommissions);
      mockCommissionRepository.update.mockResolvedValue(undefined);
      mockCommissionRepository.findManyByIds.mockResolvedValueOnce(paidCommissions);

      const result = await service.markAsPaid(commissionIds);

      expect(result).toEqual(paidCommissions);
      expect(result.every((c) => c.paid)).toBe(true);
      expect(mockCommissionRepository.update).toHaveBeenCalled();
    });

    it('should throw error when some commissions not found', async () => {
      const commissionIds = ['commission-1', 'non-existent'];
      const foundCommissions = [mockCommissions[0]];

      mockCommissionRepository.findManyByIds.mockResolvedValue(foundCommissions);

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

      mockCommissionRepository.findManyByIds.mockResolvedValueOnce(paidCommissions);
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
