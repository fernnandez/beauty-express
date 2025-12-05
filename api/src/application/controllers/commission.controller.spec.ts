import { Test, TestingModule } from '@nestjs/testing';
import { CommissionController } from './commission.controller';
import { CommissionService } from '@domain/services/commission.service';
import { Commission } from '@domain/entities/commission.entity';
import { MarkCommissionsDto } from '../dtos/commission/mark-commissions.dto';
import { parseDateString, endOfDay } from '../../utils/date.util';

describe('CommissionController', () => {
  let controller: CommissionController;
  let service: CommissionService;

  const mockCommission: Commission = {
    id: 'commission-1',
    collaboratorId: 'collaborator-1',
    scheduledServiceId: 'scheduled-1',
    amount: 10.0,
    percentage: 10,
    paid: false,
  };

  const mockCommissionService = {
    calculateCommission: jest.fn(),
    calculateCommissionsForAppointment: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCollaboratorId: jest.fn(),
    findPending: jest.fn(),
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

  describe('calculateForScheduledService', () => {
    it('should calculate commission for a scheduled service', async () => {
      mockCommissionService.calculateCommission.mockResolvedValue(
        mockCommission,
      );

      const result =
        await controller.calculateForScheduledService('scheduled-1');

      expect(result).toEqual(mockCommission);
      expect(service.calculateCommission).toHaveBeenCalledWith('scheduled-1');
    });
  });

  describe('calculateForAppointment', () => {
    const mockCommissions: Commission[] = [mockCommission];

    it('should calculate commissions for an appointment', async () => {
      mockCommissionService.calculateCommissionsForAppointment.mockResolvedValue(
        mockCommissions,
      );

      const result = await controller.calculateForAppointment('appointment-1');

      expect(result).toEqual(mockCommissions);
      expect(service.calculateCommissionsForAppointment).toHaveBeenCalledWith(
        'appointment-1',
      );
    });
  });

  describe('findAll', () => {
    const mockCommissions: Commission[] = [mockCommission];

    it('should return all commissions when no filters', async () => {
      mockCommissionService.findAll.mockResolvedValue(mockCommissions);

      const result = await controller.findAll();

      expect(result).toEqual(mockCommissions);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should filter by paid status', async () => {
      mockCommissionService.findAll.mockResolvedValue(mockCommissions);

      const result = await controller.findAll('true');

      expect(result).toEqual(mockCommissions);
      expect(service.findAll).toHaveBeenCalledWith({ paid: true });
    });

    it('should filter by unpaid status', async () => {
      mockCommissionService.findAll.mockResolvedValue(mockCommissions);

      const result = await controller.findAll('false');

      expect(result).toEqual(mockCommissions);
      expect(service.findAll).toHaveBeenCalledWith({ paid: false });
    });

    it('should filter by startDate', async () => {
      const startDate = '2024-12-01';
      mockCommissionService.findAll.mockResolvedValue(mockCommissions);

      const result = await controller.findAll(undefined, startDate);

      expect(result).toEqual(mockCommissions);
      expect(service.findAll).toHaveBeenCalledWith({
        startDate: parseDateString(startDate),
      });
    });

    it('should throw error when startDate format is invalid', async () => {
      const invalidDate = '2024/12/01';

      await expect(controller.findAll(undefined, invalidDate)).rejects.toThrow(
        'Invalid startDate format. Expected yyyy-mm-dd',
      );

      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should filter by endDate', async () => {
      const endDate = '2024-12-31';
      mockCommissionService.findAll.mockResolvedValue(mockCommissions);

      const result = await controller.findAll(undefined, undefined, endDate);

      expect(result).toEqual(mockCommissions);
      expect(service.findAll).toHaveBeenCalledWith({
        endDate: endOfDay(endDate),
      });
    });

    it('should throw error when endDate format is invalid', async () => {
      const invalidDate = '2024/12/31';

      await expect(
        controller.findAll(undefined, undefined, invalidDate),
      ).rejects.toThrow('Invalid endDate format. Expected yyyy-mm-dd');

      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should filter by collaboratorId', async () => {
      const collaboratorId = 'collaborator-1';
      mockCommissionService.findAll.mockResolvedValue(mockCommissions);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        collaboratorId,
      );

      expect(result).toEqual(mockCommissions);
      expect(service.findAll).toHaveBeenCalledWith({ collaboratorId });
    });

    it('should combine multiple filters', async () => {
      const startDate = '2024-12-01';
      const endDate = '2024-12-31';
      const collaboratorId = 'collaborator-1';
      mockCommissionService.findAll.mockResolvedValue(mockCommissions);

      const result = await controller.findAll(
        'true',
        startDate,
        endDate,
        collaboratorId,
      );

      expect(result).toEqual(mockCommissions);
      expect(service.findAll).toHaveBeenCalledWith({
        paid: true,
        startDate: parseDateString(startDate),
        endDate: endOfDay(endDate),
        collaboratorId,
      });
    });
  });

  describe('findOne', () => {
    it('should return a commission by id', async () => {
      mockCommissionService.findById.mockResolvedValue(mockCommission);

      const result = await controller.findOne(mockCommission.id);

      expect(result).toEqual(mockCommission);
      expect(service.findById).toHaveBeenCalledWith(mockCommission.id);
    });

    it('should return null when commission not found', async () => {
      mockCommissionService.findById.mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByCollaborator', () => {
    const mockCommissions: Commission[] = [mockCommission];

    it('should return commissions for a collaborator', async () => {
      mockCommissionService.findByCollaboratorId.mockResolvedValue(
        mockCommissions,
      );

      const result = await controller.findByCollaborator('collaborator-1');

      expect(result).toEqual(mockCommissions);
      expect(service.findByCollaboratorId).toHaveBeenCalledWith(
        'collaborator-1',
      );
    });
  });

  describe('findPending', () => {
    const mockCommissions: Commission[] = [mockCommission];

    it('should return pending commissions', async () => {
      mockCommissionService.findPending.mockResolvedValue(mockCommissions);

      const result = await controller.findPending();

      expect(result).toEqual(mockCommissions);
      expect(service.findPending).toHaveBeenCalled();
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
