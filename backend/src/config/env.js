import 'dotenv/config';

function required(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}

const secret = required('JWT_ACCESS_SECRET');
if (process.env.NODE_ENV === 'production' && secret.length < 32) {
  throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production');
}
required('DATABASE_URL');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT || 4000),
  jwtSecret: secret,
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  authRateLimitWindowMin: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MIN || 15),
  globalRateLimitMax: Number(process.env.GLOBAL_RATE_LIMIT_MAX || 300),
};
