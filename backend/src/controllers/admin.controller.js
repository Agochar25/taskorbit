import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';
import { audit } from '../utils/audit.js';

const pageParams = (q) => {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

/** Current user's own activity feed. */
export async function myActivity(req, res) {
  const { page, limit, skip } = pageParams(req.query);
  const where = { userId: req.user.id };
  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}

// ---- ADMIN only ----
export async function listUsers(req, res) {
  const { page, limit, skip } = pageParams(req.query);
  const [total, data] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, skip, take: limit,
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, _count: { select: { projects: true } } },
    }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}

export async function listAuditLogs(req, res) {
  const { page, limit, skip } = pageParams(req.query);
  const [total, data] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit, include: { user: { select: { email: true, fullName: true } } } }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}

export async function setRole(req, res) {
  const role = req.body?.role;
  if (!['USER', 'ADMIN'].includes(role)) throw new AppError(400, 'VALIDATION_ERROR', 'Invalid role', { role: 'role must be USER or ADMIN' });
  if (req.params.id === req.user.id) throw new AppError(400, 'VALIDATION_ERROR', 'You cannot change your own role');
  const user = await prisma.user.update({
    where: { id: req.params.id }, data: { role },
    select: { id: true, fullName: true, email: true, role: true },
  });
  audit(req.user.id, 'ROLE_CHANGED', 'User', user.id, { role });
  res.json({ data: user });
}
