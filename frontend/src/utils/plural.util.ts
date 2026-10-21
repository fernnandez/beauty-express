/**
 * Pluralização simples para rótulos em pt-BR.
 *
 * Em vez de escrever "comissão(ões)" ou "dia(s)", usa a forma correta conforme
 * a quantidade. Retorna apenas a palavra (sem o número), para compor livremente.
 *
 * @example
 *   pluralize(1, "dia", "dias")      // "dia"
 *   pluralize(3, "dia", "dias")      // "dias"
 *   `${n} ${pluralize(n, "dia", "dias")}` // "3 dias"
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return Math.abs(count) === 1 ? singular : plural;
}

/**
 * Monta "N palavra" já com o número e a forma plural correta.
 * @example countLabel(5, "serviço", "serviços") // "5 serviços"
 */
export function countLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}
