export const jwtConfig = {
  accessSecret:
    process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
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
