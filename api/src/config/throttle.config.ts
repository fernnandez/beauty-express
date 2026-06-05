export const throttleConfig = {
  loginLimit: parseInt(process.env.THROTTLE_LOGIN_LIMIT || '10', 10),
  loginTtlMs: parseInt(process.env.THROTTLE_LOGIN_TTL_MS || '60000', 10),
};
