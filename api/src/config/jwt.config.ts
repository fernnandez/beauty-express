/**
 * Resolve um secret obrigatório. Em produção, falha no boot se a env não
 * estiver definida (evita subir com um secret fraco e conhecido). Fora de
 * produção, usa um fallback de conveniência para desenvolvimento/testes.
 */
export function resolveSecret(envVar: string, devFallback: string): string {
  const value = process.env[envVar];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${envVar} é obrigatória em produção (NODE_ENV=production) e não foi definida`,
    );
  }
  return devFallback;
}

export const jwtConfig = {
  accessSecret: resolveSecret(
    'JWT_ACCESS_SECRET',
    'dev-access-secret-change-me',
  ),
  refreshSecret: resolveSecret(
    'JWT_REFRESH_SECRET',
    'dev-refresh-secret-change-me',
  ),
  accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as
    | `${number}s`
    | `${number}m`
    | `${number}h`
    | `${number}d`,
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as
    | `${number}s`
    | `${number}m`
    | `${number}h`
    | `${number}d`,
};

export const parseExpiresInSeconds = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900;
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 3600;
    case 'd':
      return amount * 86400;
    default:
      return 900;
  }
};
