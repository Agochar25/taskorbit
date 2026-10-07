import { prisma } from '../config/prisma.js';
import { logger } from './logger.js';

/** Records who did what. Never blocks or fails the request. */
export function audit(userId, action, entity, entityId, meta) {
  prisma.auditLog
    .create({ data: { userId, action, entity, entityId: entityId ?? null, meta: meta ?? undefined } })
    .catch((err) => logger.error({ err }, 'audit log write failed'));
}
