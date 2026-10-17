import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpenseRepository } from '../repositories/expense.repository';
import { ExpenseService } from './expense.service';
import { ExpenseCategory, ExpenseType } from '../entities/expense-enums';
import { TenantContextService } from './tenant-context.service';
import { TENANT_ID_MOCK } from '../../test/tenant-context.mock';

describe('ExpenseService', () => {
  let service: ExpenseService;

  const mockExpenseRepository = {
    create: jest.fn((v) => v),
    save: jest.fn((v) => Promise.resolve({ id: 'exp-1', ...v })),
    findById: jest.fn(),
    findAllByTenant: jest.fn(),
    findActiveByTenant: jest.fn(),
    delete: jest.fn(),
  };

  const mockTenantContext = {
    requireTenantId: jest.fn().mockReturnValue(TENANT_ID_MOCK),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        { provide: ExpenseRepository, useValue: mockExpenseRepository },
        { provide: TenantContextService, useValue: mockTenantContext },
      ],
    }).compile();

    service = await module.resolve<ExpenseService>(ExpenseService);
    jest.clearAllMocks();
    mockTenantContext.requireTenantId.mockReturnValue(TENANT_ID_MOCK);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create validation', () => {
    it('should reject one_time without date', async () => {
      await expect(
        service.create({
          description: 'Insumo',
          category: ExpenseCategory.SUPPLIES,
          amount: 100,
          type: ExpenseType.ONE_TIME,
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject recurring without dayOfMonth', async () => {
      await expect(
        service.create({
          description: 'Aluguel',
          category: ExpenseCategory.RENT,
          amount: 2000,
          type: ExpenseType.RECURRING,
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a recurring expense and null out date', async () => {
      const result = await service.create({
        description: 'Aluguel',
        category: ExpenseCategory.RENT,
        amount: 2000,
        type: ExpenseType.RECURRING,
        dayOfMonth: 5,
        startDate: '2026-01-01',
      } as never);

      expect(result.dayOfMonth).toBe(5);
      expect(result.date).toBeNull();
      expect(result.tenantId).toBe(TENANT_ID_MOCK);
    });
  });

  describe('findById', () => {
    it('should throw when not found', async () => {
      mockExpenseRepository.findById.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExpensesForPeriod', () => {
    it('should include one_time within range and exclude outside', async () => {
      mockExpenseRepository.findActiveByTenant.mockResolvedValue([
        {
          id: '1',
          category: ExpenseCategory.SUPPLIES,
          amount: 100,
          type: ExpenseType.ONE_TIME,
          date: '2026-10-10',
          isActive: true,
        },
        {
          id: '2',
          category: ExpenseCategory.SUPPLIES,
          amount: 999,
          type: ExpenseType.ONE_TIME,
          date: '2026-09-10',
          isActive: true,
        },
      ]);

      const result = await service.getExpensesForPeriod(
        '2026-10-01',
        '2026-10-31',
      );

      expect(result.total).toBe(100);
      expect(result.byCategory[ExpenseCategory.SUPPLIES]).toBe(100);
    });

    it('should include recurring on its due day within the fortnight only', async () => {
      mockExpenseRepository.findActiveByTenant.mockResolvedValue([
        {
          id: '1',
          category: ExpenseCategory.RENT,
          amount: 2000,
          type: ExpenseType.RECURRING,
          dayOfMonth: 5,
          startDate: '2026-01-01',
          endDate: null,
          isActive: true,
        },
      ]);

      const firstHalf = await service.getExpensesForPeriod(
        '2026-10-01',
        '2026-10-15',
      );
      const secondHalf = await service.getExpensesForPeriod(
        '2026-10-16',
        '2026-10-31',
      );

      expect(firstHalf.total).toBe(2000);
      expect(secondHalf.total).toBe(0);
    });

    it('should respect recurring vigency (startDate/endDate)', async () => {
      mockExpenseRepository.findActiveByTenant.mockResolvedValue([
        {
          id: '1',
          category: ExpenseCategory.RENT,
          amount: 2000,
          type: ExpenseType.RECURRING,
          dayOfMonth: 5,
          startDate: '2026-11-01',
          endDate: null,
          isActive: true,
        },
      ]);

      const result = await service.getExpensesForPeriod(
        '2026-10-01',
        '2026-10-31',
      );

      expect(result.total).toBe(0);
    });
  });
});
