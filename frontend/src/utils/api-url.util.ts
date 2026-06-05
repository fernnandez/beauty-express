/**
 * Garante URL absoluta para o axios.
 * Sem protocolo, o axios trata como path relativo à rota atual
 * (ex.: /backoffice/login + beauty-express...railway.app → URL quebrada).
 */
export function resolveApiBaseUrl(
  raw = import.meta.env.VITE_API_URL || 'http://localhost:3000',
): string {
  const trimmed = raw.trim().replace(/\/$/, '');

  if (!trimmed) {
    return 'http://localhost:3000';
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}
