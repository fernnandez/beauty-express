import { BadRequestException } from '@nestjs/common';

export interface CommissionRateLike {
  id: string;
  percentage: number;
}

export function resolveCommissionPercentage(
  rates: CommissionRateLike[] | undefined,
  commissionRateId?: string | null,
): number {
  const availableRates = rates ?? [];

  if (commissionRateId) {
    const selectedRate = availableRates.find(
      (rate) => rate.id === commissionRateId,
    );
    if (!selectedRate) {
      throw new BadRequestException(
        'Commission rate does not belong to the selected collaborator',
      );
    }
    return Number(selectedRate.percentage);
  }

  if (availableRates.length === 1) {
    return Number(availableRates[0].percentage);
  }

  if (availableRates.length === 0) {
    return 0;
  }

  throw new BadRequestException(
    'A commission rate must be selected for this collaborator',
  );
}

export function resolveCommissionRateId(
  rates: CommissionRateLike[] | undefined,
  requestedRateId?: string | null,
): string | null {
  const availableRates = rates ?? [];

  if (requestedRateId) {
    const selectedRate = availableRates.find(
      (rate) => rate.id === requestedRateId,
    );
    if (!selectedRate) {
      throw new BadRequestException(
        'Commission rate does not belong to the selected collaborator',
      );
    }
    return selectedRate.id;
  }

  if (availableRates.length === 1) {
    return availableRates[0].id;
  }

  return null;
}
