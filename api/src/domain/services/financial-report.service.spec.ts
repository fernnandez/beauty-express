import { Test, TestingModule } from '@nestjs/testing';
import { FinancialReportService } from './financial-report.service';
import { ScheduledServiceRepository } from '../repositories/scheduled-service.repository';
import { CommissionRepository } from '../repositories/commission.repository';
import { ScheduledService, ScheduledServiceStatus } from '../entities/scheduled-service.entity';
import { Commission } from '../entities/commission.entity';

describe('FinancialReportService', () => {
  let service: FinancialReportService;
  let scheduledServiceRepository: jest.Mocked<ScheduledServiceRepository>;
  let commissionRepository: jest.Mocked<CommissionRepository>;

  const mockScheduledServiceRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockCommissionRepository = {
    findByFilters: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialReportService,
        {
          provide: ScheduledServiceRepository,
          useValue: mockScheduledServiceRepository,
        },
        {
          provide: CommissionRepository,
          useValue: mockCommissionRepository,
        },
      ],
    }).compile();

    service = module.get<FinancialReportService>(FinancialReportService);
    scheduledServiceRepository = module.get(ScheduledServiceRepository);
    commissionRepository = module.get(CommissionRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonthlyReport', () => {
    const mockScheduledServices: ScheduledService[] = [
      {
        id: 'scheduled-1',
        appointmentId: 'appointment-1',
        serviceId: 'service-1',
        price: 100.0,
        status: ScheduledServiceStatus.COMPLETED,
      } as ScheduledService,
      {
        id: 'scheduled-2',
        appointmentId: 'appointment-1',
        serviceId: 'service-2',
        price: 50.0,
        status: ScheduledServiceStatus.COMPLETED,
      } as ScheduledService,
      {
        id: 'scheduled-3',
        appointmentId: 'appointment-2',
        serviceId: 'service-3',
        price: 30.0,
        status: ScheduledServiceStatus.PENDING,
      } as ScheduledService,
    ];

    const mockPaidCommissions: Commission[] = [
      {
        id: 'commission-1',
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-1',
        amount: 10.0,
        percentage: 10,
        paid: true,
      },
      {
        id: 'commission-2',
        collaboratorId: 'collaborator-1',
        scheduledServiceId: 'scheduled-2',
        amount: 5.0,
        percentage: 10,
        paid: true,
      },
    ];

    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    it('should generate monthly report correctly', async () => {
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue(mockScheduledServices);
      mockCommissionRepository.findByFilters.mockResolvedValue(mockPaidCommissions);

      const result = await service.getMonthlyReport(2024, 12);

      expect(result.totalScheduled).toBe(180.0); // 100 + 50 + 30
      expect(result.totalPaid).toBe(150.0); // 100 + 50 (apenas completed)
      expect(result.totalUnpaid).toBe(30.0); // 30 (pending)
      expect(result.totalCommissionsPaid).toBe(15.0); // 10 + 5
      expect(result.netAmount).toBe(135.0); // 150 - 15
      expect(result.period.startDate).toBeDefined();
      expect(result.period.endDate).toBeDefined();
    });

    it('should handle month with no data', async () => {
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCommissionRepository.findByFilters.mockResolvedValue([]);

      const result = await service.getMonthlyReport(2024, 1);

      expect(result.totalScheduled).toBe(0);
      expect(result.totalPaid).toBe(0);
      expect(result.totalUnpaid).toBe(0);
      expect(result.totalCommissionsPaid).toBe(0);
      expect(result.netAmount).toBe(0);
    });

    it('should calculate net amount correctly when no commissions paid', async () => {
      const completedServices: ScheduledService[] = [
        {
          id: 'scheduled-1',
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
      mockCommissionRepository.findByFilters.mockResolvedValue([]);

      const result = await service.getMonthlyReport(2024, 12);

      expect(result.totalPaid).toBe(100.0);
      expect(result.totalCommissionsPaid).toBe(0);
      expect(result.netAmount).toBe(100.0);
    });

    it('should handle cancelled services correctly', async () => {
      const servicesWithCancelled: ScheduledService[] = [
        {
          id: 'scheduled-1',
          appointmentId: 'appointment-1',
          serviceId: 'service-1',
          price: 100.0,
          status: ScheduledServiceStatus.COMPLETED,
        } as ScheduledService,
        {
          id: 'scheduled-2',
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
      mockCommissionRepository.findByFilters.mockResolvedValue([]);

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
      mockCommissionRepository.findByFilters.mockResolvedValue(mockPaidCommissions);

      // Teste para janeiro (mês 1)
      await service.getMonthlyReport(2024, 1);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      const whereCall = mockQueryBuilder.where.mock.calls[0][0];
      expect(whereCall).toContain('appointment.date BETWEEN');

      // Teste para dezembro (mês 12)
      await service.getMonthlyReport(2024, 12);

      expect(mockQueryBuilder.where).toHaveBeenCalledTimes(2);
    });

    it('should handle leap year February correctly', async () => {
      mockScheduledServiceRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCommissionRepository.findByFilters.mockResolvedValue([]);

      // Fevereiro de 2024 (ano bissexto)
      await service.getMonthlyReport(2024, 2);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });
});

