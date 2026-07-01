import { Test, TestingModule } from '@nestjs/testing';
import { CommissionController } from './commission.controller';
import { CommissionService } from '@domain/services/commission.service';
import { Commission } from '@domain/entities/commission.entity';
import { MarkCommissionsDto } from '../dtos/commission/mark-commissions.dto';
import { parseDateString, endOfDay } from '../../utils/date.util';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';
import { CommissionListResult } from '@domain/repositories/commission-list.types';

describe('CommissionController', () => {
  let controller: CommissionController;
  let service: CommissionService;

  const mockCommission: Commission = {
    id: 'commission-1',
      tenantId: TENANT_ID_MOCK,
    collaboratorId: 'collaborator-1',
    scheduledServiceId: 'scheduled-1',
    amount: 10.0,
    percentage: 10,
    paid: false,
  };

  const mockListResult: CommissionListResult = {
    items: [mockCommission],
    total: 1,
    page: 1,
    limit: 50,
    summary: {
      totalAmount: 10,
      pendingAmount: 10,
      paidAmount: 0,
    },
  };

  const mockCommissionService = {
    findAll: jest.fn(),
    markAsPaid: jest.fn(),
    markAsUnpaid: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionController],
      providers: [
        {
          provide: CommissionService,
          useValue: mockCommissionService,
        },
      ],
    }).compile();

    controller = module.get<CommissionController>(CommissionController);
    service = module.get<CommissionService>(CommissionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated commissions when no filters', async () => {
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      const result = await controller.findAll();

      expect(result).toEqual(mockListResult);
      expect(service.findAll).toHaveBeenCalledWith(undefined, 1, 50);
    });

    it('should filter by paid status', async () => {
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      const result = await controller.findAll('true');

      expect(result).toEqual(mockListResult);
      expect(service.findAll).toHaveBeenCalledWith({ paid: true }, 1, 50);
    });

    it('should filter by unpaid status', async () => {
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      const result = await controller.findAll('false');

      expect(result).toEqual(mockListResult);
      expect(service.findAll).toHaveBeenCalledWith({ paid: false }, 1, 50);
    });

    it('should filter by startDate', async () => {
      const startDate = '2024-12-01';
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      const result = await controller.findAll(undefined, startDate);

      expect(result).toEqual(mockListResult);
      expect(service.findAll).toHaveBeenCalledWith(
        {
          startDate: parseDateString(startDate),
        },
        1,
        50,
      );
    });

    it('should throw error when startDate format is invalid', async () => {
      const invalidDate = '2024/12/01';

      await expect(controller.findAll(undefined, invalidDate)).rejects.toThrow(
        'Invalid date format. Expected yyyy-mm-dd, got: 2024/12/01',
      );

      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should filter by endDate', async () => {
      const endDate = '2024-12-31';
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      const result = await controller.findAll(undefined, undefined, endDate);

      expect(result).toEqual(mockListResult);
      expect(service.findAll).toHaveBeenCalledWith(
        {
          endDate: endOfDay(endDate),
        },
        1,
        50,
      );
    });

    it('should throw error when endDate format is invalid', async () => {
      const invalidDate = '2024/12/31';

      await expect(
        controller.findAll(undefined, undefined, invalidDate),
      ).rejects.toThrow(
        'Invalid date format. Expected yyyy-mm-dd, got: 2024/12/31',
      );

      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should filter by collaboratorId', async () => {
      const collaboratorId = 'collaborator-1';
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        collaboratorId,
      );

      expect(result).toEqual(mockListResult);
      expect(service.findAll).toHaveBeenCalledWith(
        {
          collaboratorIds: [collaboratorId],
        },
        1,
        50,
      );
    });

    it('should filter by multiple collaboratorIds', async () => {
      const collaboratorIds = ['collaborator-1', 'collaborator-2'];
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        collaboratorIds,
      );

      expect(result).toEqual(mockListResult);
      expect(service.findAll).toHaveBeenCalledWith(
        { collaboratorIds },
        1,
        50,
      );
    });

    it('should combine multiple filters', async () => {
      const startDate = '2024-12-01';
      const endDate = '2024-12-31';
      const collaboratorId = 'collaborator-1';
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      const result = await controller.findAll(
        'true',
        startDate,
        endDate,
        collaboratorId,
      );

      expect(result).toEqual(mockListResult);
      expect(service.findAll).toHaveBeenCalledWith(
        {
          paid: true,
          startDate: parseDateString(startDate),
          endDate: endOfDay(endDate),
          collaboratorIds: [collaboratorId],
        },
        1,
        50,
      );
    });

    it('should pass pagination params', async () => {
      mockCommissionService.findAll.mockResolvedValue(mockListResult);

      await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '2',
        '25',
      );

      expect(service.findAll).toHaveBeenCalledWith(undefined, 2, 25);
    });
  });

  describe('markAsPaid', () => {
    const markDto: MarkCommissionsDto = {
      commissionIds: ['commission-1', 'commission-2'],
    };

    const paidCommissions: Commission[] = [
      { ...mockCommission, paid: true },
      { ...mockCommission, id: 'commission-2', paid: true },
    ];

    it('should mark commissions as paid', async () => {
      mockCommissionService.markAsPaid.mockResolvedValue(paidCommissions);

      const result = await controller.markAsPaid(markDto);

      expect(result).toEqual(paidCommissions);
      expect(service.markAsPaid).toHaveBeenCalledWith(markDto.commissionIds);
    });
  });

  describe('markAsUnpaid', () => {
    const markDto: MarkCommissionsDto = {
      commissionIds: ['commission-1'],
    };

    const unpaidCommission: Commission = {
      ...mockCommission,
      paid: false,
    };

    it('should mark commissions as unpaid', async () => {
      mockCommissionService.markAsUnpaid.mockResolvedValue([unpaidCommission]);

      const result = await controller.markAsUnpaid(markDto);

      expect(result).toEqual([unpaidCommission]);
      expect(service.markAsUnpaid).toHaveBeenCalledWith(markDto.commissionIds);
    });
  });
});
