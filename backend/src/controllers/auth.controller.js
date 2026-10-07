import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { issueTokens, sha256 } from '../utils/tokens.js';
import { audit } from '../utils/audit.js';

const publicUser = (u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, createdAt: u.createdAt });

// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export async function register(req, res) {
  const { fullName, email, password } = req.valid.body;
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists', { email: 'Email is already registered' });
  }
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const user = await prisma.user.create({ data: { fullName, email, passwordHash } });
  audit(user.id, 'USER_REGISTERED', 'User', user.id);
  res.status(201).json({ user: publicUser(user), ...(await issueTokens(user)) });
}

export async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  audit(user.id, 'USER_LOGGED_IN', 'User', user.id, { client: req.get('x-client') || 'unknown' });
  res.json({ user: publicUser(user), ...(await issueTokens(user)) });
}

/** Exchanges a refresh token for a new pair. Tokens rotate; reuse of an old one revokes the whole family. */
export async function refresh(req, res) {
  const token = req.body?.refreshToken;
  if (typeof token !== 'string' || !token) throw new AppError(400, 'VALIDATION_ERROR', 'refreshToken is required', { refreshToken: 'refreshToken is required' });
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!record) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Please log in again');
  if (record.revokedAt) {
    // Small grace window: two tabs refreshing at once is not an attack.
    if (Date.now() - record.revokedAt.getTime() < 10_000) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Please log in again');
    await prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Please log in again');
  }
  if (record.expiresAt < new Date()) throw new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.');
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  res.json({ user: publicUser(record.user), ...(await issueTokens(record.user)) });
}

export async function logout(req, res) {
  const token = req.body?.refreshToken;
  if (typeof token === 'string' && token) {
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (record && !record.revokedAt) {
      await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
      audit(record.userId, 'USER_LOGGED_OUT', 'User', record.userId);
    }
  }
  res.json({ message: 'Logged out' });
}

export const me = (req, res) => res.json({ user: req.user });
