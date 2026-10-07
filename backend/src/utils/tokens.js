import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.accessTtl, algorithm: 'HS256' });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });

/** Issues an access token + an opaque refresh token. Only the refresh token's hash is stored. */
export async function issueTokens(user) {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + env.refreshTtlDays * 86400000),
    },
  });
  return { accessToken: signAccessToken(user), refreshToken, tokenType: 'Bearer', expiresIn: env.accessTtl };
}
