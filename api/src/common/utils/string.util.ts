/**
 * Utilitários para manipulação de strings
 */

/**
 * Normaliza uma string: se for vazia, undefined ou apenas espaços, retorna null
 * Caso contrário, retorna a string trimada
 */
export function normalizeString(
  value: string | undefined | null,
): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
