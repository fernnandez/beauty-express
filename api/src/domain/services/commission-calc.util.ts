/**
 * Calcula o valor da comissão de um serviço agendado.
 *
 * Regra única do domínio: a comissão é o percentual do serviço aplicado
 * sobre o preço efetivamente cobrado no agendamento.
 *
 * Centralizado aqui para evitar divergência entre os pontos que calculam
 * comissão (scheduled-service, commission e seeds).
 */
export function calcCommissionAmount(
  price: unknown,
  commissionPercentage: unknown,
): number {
  const priceNumber = Number(price ?? 0);
  const percentage = Number(commissionPercentage ?? 0);

  if (!Number.isFinite(priceNumber) || !Number.isFinite(percentage)) {
    return 0;
  }

  return (priceNumber * percentage) / 100;
}
