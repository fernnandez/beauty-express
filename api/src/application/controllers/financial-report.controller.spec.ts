import { Test, TestingModule } from '@nestjs/testing';
import { FinancialReportController } from './financial-report.controller';
import { FinancialReportService } from '@domain/services/financial-report.service';

describe('FinancialReportController', () => {
  let controller: FinancialReportController;
  let service: FinancialReportService;

  const mockReport = {
    totalScheduled: 180.0,
    totalPaid: 150.0,
    totalUnpaid: 30.0,
    totalCommissionsPaid: 15.0,
    totalCommissionsExpected: 23.0,
    netAmount: 135.0,
    netAmountExpected: 127.0,
    period: {
      startDate: '2024-12-01',
      endDate: '2024-12-31',
    },
  };

  const mockFinancialReportService = {
    getMonthlyReport: jest.fn(),
    getReportForPeriod: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialReportController],
      providers: [
        {
          provide: FinancialReportService,
          useValue: mockFinancialReportService,
        },
      ],
    }).compile();

    controller = module.get<FinancialReportController>(FinancialReportController);
    service = module.get<FinancialReportService>(FinancialReportService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMonthlyReport', () => {
    it('should return monthly report for valid month and year', async () => {
      mockFinancialReportService.getMonthlyReport.mockResolvedValue(mockReport);

      const result = await controller.getMonthlyReport(2024, 12);

      expect(result).toEqual(mockReport);
      expect(service.getMonthlyReport).toHaveBeenCalledWith(2024, 12);
    });

    it('should throw error when month is less than 1', async () => {
      await expect(controller.getMonthlyReport(2024, 0)).rejects.toThrow(
        'Month must be between 1 and 12',
      );

      expect(service.getMonthlyReport).not.toHaveBeenCalled();
    });

    it('should throw error when month is greater than 12', async () => {
      await expect(controller.getMonthlyReport(2024, 13)).rejects.toThrow(
        'Month must be between 1 and 12',
      );

      expect(service.getMonthlyReport).not.toHaveBeenCalled();
    });

    it('should throw error when year is less than 2000', async () => {
      await expect(controller.getMonthlyReport(1999, 12)).rejects.toThrow(
        'Year must be between 2000 and 2100',
      );

      expect(service.getMonthlyReport).not.toHaveBeenCalled();
    });

    it('should throw error when year is greater than 2100', async () => {
      await expect(controller.getMonthlyReport(2101, 12)).rejects.toThrow(
        'Year must be between 2000 and 2100',
      );

      expect(service.getMonthlyReport).not.toHaveBeenCalled();
    });

    it('should accept valid month and year ranges', async () => {
      mockFinancialReportService.getMonthlyReport.mockResolvedValue(mockReport);

      // Teste mês mínimo
      await controller.getMonthlyReport(2024, 1);
      expect(service.getMonthlyReport).toHaveBeenCalledWith(2024, 1);

      // Teste mês máximo
      await controller.getMonthlyReport(2024, 12);
      expect(service.getMonthlyReport).toHaveBeenCalledWith(2024, 12);

      // Teste ano mínimo
      await controller.getMonthlyReport(2000, 6);
      expect(service.getMonthlyReport).toHaveBeenCalledWith(2000, 6);

      // Teste ano máximo
      await controller.getMonthlyReport(2100, 6);
      expect(service.getMonthlyReport).toHaveBeenCalledWith(2100, 6);
    });
  });

  describe('getPeriodReport', () => {
    it('should return report for valid date range', async () => {
      mockFinancialReportService.getReportForPeriod.mockResolvedValue(mockReport);

      const result = await controller.getPeriodReport('2024-12-01', '2024-12-15');

      expect(result).toEqual(mockReport);
      expect(service.getReportForPeriod).toHaveBeenCalledWith(
        '2024-12-01',
        '2024-12-15',
      );
    });

    it('should throw error for invalid date format', async () => {
      await expect(
        controller.getPeriodReport('2024/12/01', '2024-12-15'),
      ).rejects.toThrow(
        'Invalid date format. Expected yyyy-mm-dd for startDate and endDate',
      );

      expect(service.getReportForPeriod).not.toHaveBeenCalled();
    });

    it('should throw error when startDate is after endDate', async () => {
      await expect(
        controller.getPeriodReport('2024-12-20', '2024-12-01'),
      ).rejects.toThrow('startDate must be less than or equal to endDate');

      expect(service.getReportForPeriod).not.toHaveBeenCalled();
    });
  });
});

