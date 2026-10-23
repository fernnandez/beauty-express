/**
 * Converte um valor monetário (number ou string decimal) para number.
 * Tolera o formato brasileiro com vírgula ("45,00") e o padrão com ponto,
 * espelhando o tratamento do frontend (money.util.ts) para evitar divergência.
 */
export function parseMoney(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Arredonda um valor monetário para 2 casas decimais (half-up), evitando
 * frações de centavo acumuladas em comissões, relatórios e totais.
 *
 * Regra única do domínio — usar sempre que um valor em dinheiro for derivado
 * de multiplicação/percentual antes de persistir ou exibir.
 */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula o valor da comissão de um serviço agendado.
 *
 * Regra única do domínio: a comissão é o percentual do serviço aplicado
 * sobre o preço efetivamente cobrado no agendamento, arredondado a 2 casas.
 *
 * Centralizado aqui para evitar divergência entre os pontos que calculam
 * comissão (scheduled-service, commission e seeds).
 */
export function calcCommissionAmount(
  price: unknown,
  commissionPercentage: unknown,
): number {
  const priceNumber = parseMoney(price);
  const percentage = parseMoney(commissionPercentage);

  if (!Number.isFinite(priceNumber) || !Number.isFinite(percentage)) {
    return 0;
  }

  return roundMoney((priceNumber * percentage) / 100);
}
