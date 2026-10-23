import { Test, TestingModule } from '@nestjs/testing';
import { FinancialReportService } from './financial-report.service';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ExpenseService } from './expense.service';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../entities/scheduled-service.entity';
import { Commission } from '../entities/commission.entity';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { TenantContextService } from './tenant-context.service';
import { mockTenantContextService } from '../../test/tenant-context.mock';

describe('FinancialReportService', () => {
  let service: FinancialReportService;

  const mockScheduledServiceRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockCommissionRepository = {
    findByFilters: jest.fn(),
  };

  const mockExpenseService = {
    getExpensesForPeriod: jest
      .fn()
      .mockResolvedValue({ total: 0, byCategory: {} }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialReportService,
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: ScheduledServiceRepository,
          useValue: mockScheduledServiceRepository,
        },
        {
          provide: CommissionRepository,
          useValue: mockCommissionRepository,
        },
        {
          provide: ExpenseService,
          useValue: mockExpenseService,
        },
      ],
    }).compile();

    service = await module.resolve<FinancialReportService>(
      FinancialReportService,
    );

    jest.clearAllMocks();
    mockExpenseService.getExpensesForPeriod.mockResolvedValue({
      total: 0,
      byCategory: {},
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonthlyReport', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        tenantId: TENANT_ID_MOCK,
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        price: 100.0,
        status: ScheduledServiceStatus.COMPLETED,
      } as ScheduledService,
      {
        id: 'scheduled-2',
        tenantId: TENANT_ID_MOCK,
        appointmentId: 'appointment-1',
        serviceId: 'service-2',
        price: 50.0,
        status: ScheduledServiceStatus.COMPLETED,
      } as ScheduledService,
      {
        id: 'scheduled-3',
        tenantId: TENANT_ID_MOCK,
        appointmentId: 'appointment-2',
        serviceId: 'service-3',
        price: 30.0,
        status: ScheduledServiceStatus.PENDING,
      } as ScheduledService,
    ];

    const mockPaidCommissions: Commission[] = [
      {
        id: 'commission-1',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-1',
        amount: 10.0,
        percentage: 10,
        paid: true,
      },
      {
        id: 'commission-2',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-2',
        amount: 5.0,
        percentage: 10,
        paid: true,
      },
    ];

    const mockAllCommissions: Commission[] = [
      ...mockPaidCommissions,
      {
        id: 'commission-3',
        tenantId: TENANT_ID_MOCK,
        collaboratorId: 'collaborator-2',
        scheduledServiceId: 'scheduled-1',
        amount: 8.0,
        percentage: 8,
        paid: false,
      },
    ];

    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    it('should generate monthly report correctly', async () => {
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue(mockScheduledServices);
      // Primeira chamada: comissões pagas
      // Segunda chamada: todas as comissões
      mockCommissionRepository.findByFilters
        .mockResolvedValueOnce(mockPaidCommissions)
        .mockResolvedValueOnce(mockAllCommissions);

      const result = await service.getMonthlyReport(2024, 12);

      expect(result.totalScheduled).toBe(180.0); // 100 + 50 + 30
      expect(result.totalPaid).toBe(150.0); // 100 + 50 (apenas completed)
      expect(result.totalUnpaid).toBe(30.0); // 30 (pending)
      expect(result.totalCommissionsPaid).toBe(15.0); // 10 + 5
      expect(result.totalCommissionsExpected).toBe(23.0); // 10 + 5 + 8
      expect(result.netAmount).toBe(135.0); // 150 - 15
      expect(result.netAmountExpected).toBe(127.0); // 150 - 23
      expect(result.totalExpenses).toBe(0);
      expect(result.netProfit).toBe(135.0); // 150 - 15 - 0 despesas
      expect(result.period.startDate).toBeDefined();
      expect(result.period.endDate).toBeDefined();
    });

    it('should subtract expenses from net profit', async () => {
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue(mockScheduledServices);
      mockCommissionRepository.findByFilters
        .mockResolvedValueOnce(mockPaidCommissions)
        .mockResolvedValueOnce(mockAllCommissions);
      mockExpenseService.getExpensesForPeriod.mockResolvedValue({
        total: 50,
        byCategory: { aluguel: 50 },
      });

      const result = await service.getMonthlyReport(2024, 12);

      expect(result.totalPaid).toBe(150.0);
      expect(result.totalCommissionsPaid).toBe(15.0);
      expect(result.totalExpenses).toBe(50);
      expect(result.expensesByCategory).toEqual({ aluguel: 50 });
      // lucro = 150 - 15 - 50
      expect(result.netProfit).toBe(85.0);
      // netAmount (sem despesas) permanece 135
      expect(result.netAmount).toBe(135.0);
    });

    it('should handle month with no data', async () => {
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCommissionRepository.findByFilters
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getMonthlyReport(2024, 1);

      expect(result.totalScheduled).toBe(0);
      expect(result.totalPaid).toBe(0);
      expect(result.totalUnpaid).toBe(0);
      expect(result.totalCommissionsPaid).toBe(0);
      expect(result.totalCommissionsExpected).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.netAmountExpected).toBe(0);
    });

    it('should calculate net amount correctly when no commissions paid', async () => {
      const completedServices: ScheduledService[] = [
        {
          id: 'scheduled-1',
          tenantId: TENANT_ID_MOCK,
          appointmentId: 'appointment-1',
          serviceId: 'service-1',
          price: 100.0,
          status: ScheduledServiceStatus.COMPLETED,
        } as ScheduledService,
      ];

      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue(completedServices);
      mockCommissionRepository.findByFilters
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getMonthlyReport(2024, 12);

      expect(result.totalPaid).toBe(100.0);
      expect(result.totalCommissionsPaid).toBe(0);
      expect(result.totalCommissionsExpected).toBe(0);
      expect(result.netAmount).toBe(100.0);
      expect(result.netAmountExpected).toBe(100.0);
    });

    it('should handle cancelled services correctly', async () => {
      const servicesWithCancelled: ScheduledService[] = [
        {
          id: 'scheduled-1',
          tenantId: TENANT_ID_MOCK,
          appointmentId: 'appointment-1',
          serviceId: 'service-1',
          price: 100.0,
          status: ScheduledServiceStatus.COMPLETED,
        } as ScheduledService,
        {
          id: 'scheduled-2',
          tenantId: TENANT_ID_MOCK,
          appointmentId: 'appointment-1',
          serviceId: 'service-2',
          price: 50.0,
          status: ScheduledServiceStatus.CANCELLED,
        } as ScheduledService,
      ];

      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue(servicesWithCancelled);
      mockCommissionRepository.findByFilters
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getMonthlyReport(2024, 12);

      expect(result.totalScheduled).toBe(150.0);
      expect(result.totalPaid).toBe(100.0); // apenas completed
      expect(result.totalUnpaid).toBe(0); // cancelled não conta como unpaid
    });

    it('should handle different months correctly', async () => {
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue(mockScheduledServices);
      mockCommissionRepository.findByFilters
        .mockResolvedValue(mockPaidCommissions)
        .mockResolvedValue(mockAllCommissions);

      // Teste para janeiro (mês 1)
      await service.getMonthlyReport(2024, 1);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'scheduledService.tenantId = :tenantId',
        { tenantId: TENANT_ID_MOCK },
      );
      const dateFilterCall = mockQueryBuilder.andWhere.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('appointment.date BETWEEN'),
      );
      expect(dateFilterCall).toBeDefined();

      // Teste para dezembro (mês 12)
      await service.getMonthlyReport(2024, 12);

      expect(mockQueryBuilder.where).toHaveBeenCalledTimes(2);
    });

    it('should handle leap year February correctly', async () => {
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCommissionRepository.findByFilters
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Fevereiro de 2024 (ano bissexto)
      await service.getMonthlyReport(2024, 2);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    describe('getMonthlyTimeseries', () => {
      function mockRawQueryBuilder(rawRows: unknown[]) {
        const qb: Record<string, jest.Mock> = {};
        [
          'select',
          'addSelect',
          'innerJoin',
          'where',
          'andWhere',
          'groupBy',
          'addGroupBy',
          'orderBy',
          'limit',
        ].forEach((m) => {
          qb[m] = jest.fn().mockReturnValue(qb);
        });
        qb.getRawMany = jest.fn().mockResolvedValue(rawRows);
        return qb;
      }

      it('should return a point per month and fill empty months with zeros', async () => {
        // Sem linhas: todos os meses devem vir zerados.
        const qb = mockRawQueryBuilder([]);
        mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
          qb as any,
        );

        const result = await service.getMonthlyTimeseries(6);

        expect(result).toHaveLength(6);
        expect(result.every((p) => p.appointmentsCount === 0)).toBe(true);
        expect(result.every((p) => p.averageTicket === 0)).toBe(true);
        // meses em ordem crescente
        const months = result.map((p) => p.month);
        expect([...months].sort()).toEqual(months);
      });

      it('should compute averageTicket as revenue / appointments for a month', async () => {
        const now = new Date();
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const qb = mockRawQueryBuilder([
          {
            month: key,
            appointmentsCount: '4',
            servicesCount: '5',
            revenue: '400',
          },
        ]);
        mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
          qb as any,
        );

        const result = await service.getMonthlyTimeseries(6);
        const current = result.find((p) => p.month === key)!;

        expect(current.appointmentsCount).toBe(4);
        expect(current.servicesCount).toBe(5);
        expect(current.revenue).toBe(400);
        expect(current.averageTicket).toBe(100);
      });
    });

    describe('getTopServices', () => {
      it('should map raw rows to typed items ordered by the query', async () => {
        const qb: Record<string, jest.Mock> = {};
        [
          'select',
          'addSelect',
          'innerJoin',
          'where',
          'andWhere',
          'groupBy',
          'addGroupBy',
          'orderBy',
          'limit',
        ].forEach((m) => {
          qb[m] = jest.fn().mockReturnValue(qb);
        });
        qb.getRawMany = jest.fn().mockResolvedValue([
          {
            serviceId: 's1',
            serviceName: 'Corte',
            quantity: '17',
            revenue: '765',
          },
          {
            serviceId: 's2',
            serviceName: 'Manicure',
            quantity: '16',
            revenue: '400',
          },
        ]);
        mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
          qb as any,
        );

        const result = await service.getTopServices(12, 5);

        expect(result).toEqual([
          { serviceId: 's1', serviceName: 'Corte', quantity: 17, revenue: 765 },
          {
            serviceId: 's2',
            serviceName: 'Manicure',
            quantity: 16,
            revenue: 400,
          },
        ]);
        expect(qb.limit).toHaveBeenCalledWith(5);
      });
    });
  });
});
