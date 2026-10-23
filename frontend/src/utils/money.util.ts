/**
 * Converte valores monetários da API (number ou string decimal) para number.
 * PostgreSQL/TypeORM serializa colunas decimal como string no JSON.
 */
export function toMoney(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function formatPrice(value: unknown): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(toMoney(value));
}

export function sumMoney(values: Iterable<unknown>): number {
  let total = 0;
  for (const value of values) {
    total += toMoney(value);
  }
  return total;
}

/**
 * Arredonda um valor monetário para 2 casas decimais (half-up).
 * Espelha roundMoney do backend (commission-calc.util) para consistência.
 */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Comissão de um serviço: percentual aplicado sobre o preço cobrado,
 * arredondado a 2 casas. Espelha a regra do backend (commission-calc.util).
 */
export function calcCommission(
  price: unknown,
  commissionPercentage: unknown,
): number {
  const pct = toMoney(commissionPercentage);
  return roundMoney((toMoney(price) * pct) / 100);
}
