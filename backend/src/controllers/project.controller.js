import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';
import { audit } from '../utils/audit.js';
import { projectHealth } from '../utils/health.js';

const toDate = (v) => (v ? new Date(v) : v);

/** Adds taskCount / progress / health to a list of projects using two grouped queries. */
async function withStats(projects) {
  if (projects.length === 0) return [];
  const ids = projects.map((p) => p.id);
  const [byStatus, overdue] = await Promise.all([
    prisma.task.groupBy({ by: ['projectId', 'status'], where: { projectId: { in: ids } }, _count: { _all: true } }),
    prisma.task.groupBy({
      by: ['projectId'],
      where: { projectId: { in: ids }, status: { not: 'COMPLETED' }, dueDate: { lt: new Date(new Date().toISOString().slice(0, 10)) } },
      _count: { _all: true },
    }),
  ]);
  return projects.map((p) => {
    const rows = byStatus.filter((r) => r.projectId === p.id);
    const taskCount = rows.reduce((n, r) => n + r._count._all, 0);
    const completedCount = rows.find((r) => r.status === 'COMPLETED')?._count._all ?? 0;
    const overdueCount = overdue.find((r) => r.projectId === p.id)?._count._all ?? 0;
    return {
      ...p,
      taskCount,
      completedCount,
      overdueCount,
      progress: taskCount ? Math.round((completedCount / taskCount) * 100) : 0,
      health: projectHealth(p, { taskCount, completedCount, overdueCount }),
    };
  });
}

async function findOwned(id, ownerId) {
  // Same 404 whether it doesn't exist or belongs to someone else - no information leak.
  const project = await prisma.project.findFirst({ where: { id, ownerId } });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  return project;
}

export async function list(req, res) {
  const { page, limit, sortBy, order, search, status } = req.valid.query;
  const where = {
    ownerId: req.user.id,
    ...(status && { status }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };
  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({ where, orderBy: { [sortBy]: order }, skip: (page - 1) * limit, take: limit }),
  ]);
  res.json({ data: await withStats(rows), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}

export async function getOne(req, res) {
  const project = await findOwned(req.params.id, req.user.id);
  const [withStat] = await withStats([project]);
  res.json({ data: withStat });
}

export async function create(req, res) {
  const d = req.valid.body;
  const project = await prisma.project.create({
    data: { ...d, startDate: toDate(d.startDate), endDate: toDate(d.endDate), ownerId: req.user.id },
  });
  audit(req.user.id, 'PROJECT_CREATED', 'Project', project.id, { name: project.name });
  const [withStat] = await withStats([project]);
  res.status(201).json({ data: withStat });
}

export async function update(req, res) {
  await findOwned(req.params.id, req.user.id);
  const d = req.valid.body;
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: { ...d, ...('startDate' in d && { startDate: toDate(d.startDate) }), ...('endDate' in d && { endDate: toDate(d.endDate) }) },
  });
  audit(req.user.id, 'PROJECT_UPDATED', 'Project', project.id, { fields: Object.keys(d) });
  const [withStat] = await withStats([project]);
  res.json({ data: withStat });
}

export async function remove(req, res) {
  const project = await findOwned(req.params.id, req.user.id);
  await prisma.project.delete({ where: { id: project.id } });
  audit(req.user.id, 'PROJECT_DELETED', 'Project', project.id, { name: project.name });
  res.status(204).end();
}
