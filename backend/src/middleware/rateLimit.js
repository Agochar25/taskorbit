import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const handler = (_req, res) =>
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a few minutes and try again.' } });

/** Brute-force protection for login/register/refresh, keyed by client IP. */
export const authLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMin * 60 * 1000,
  limit: env.authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count towards the limit
  handler,
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.globalRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});
