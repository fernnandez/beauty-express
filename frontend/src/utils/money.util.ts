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
