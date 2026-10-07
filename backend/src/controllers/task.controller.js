import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';
import { audit } from '../utils/audit.js';

const toDate = (v) => (v ? new Date(v) : v);
const include = { project: { select: { id: true, name: true } } };

async function findOwned(id, userId) {
  // Ownership is enforced through the parent project.
  const task = await prisma.task.findFirst({ where: { id, project: { ownerId: userId } }, include });
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');
  return task;
}

export async function list(req, res) {
  const { page, limit, sortBy, order, search, status, priority, projectId } = req.valid.query;
  const where = {
    project: { ownerId: req.user.id },
    ...(projectId && { projectId }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };
  const [total, data] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({ where, include, orderBy: { [sortBy]: order }, skip: (page - 1) * limit, take: limit }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}

export async function getOne(req, res) {
  res.json({ data: await findOwned(req.params.id, req.user.id) });
}

export async function create(req, res) {
  const d = req.valid.body;
  const project = await prisma.project.findFirst({ where: { id: d.projectId, ownerId: req.user.id }, select: { id: true } });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  const task = await prisma.task.create({
    data: { ...d, dueDate: toDate(d.dueDate), completedAt: d.status === 'COMPLETED' ? new Date() : null },
    include,
  });
  audit(req.user.id, 'TASK_CREATED', 'Task', task.id, { name: task.name, projectId: task.projectId });
  res.status(201).json({ data: task });
}

export async function update(req, res) {
  const existing = await findOwned(req.params.id, req.user.id);
  const d = req.valid.body;
  const data = { ...d, ...('dueDate' in d && { dueDate: toDate(d.dueDate) }) };
  if (d.status && d.status !== existing.status) data.completedAt = d.status === 'COMPLETED' ? new Date() : null;
  const task = await prisma.task.update({ where: { id: existing.id }, data, include });
  const action = d.status === 'COMPLETED' && existing.status !== 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED';
  audit(req.user.id, action, 'Task', task.id, { fields: Object.keys(d), name: task.name });
  res.json({ data: task });
}

export async function remove(req, res) {
  const task = await findOwned(req.params.id, req.user.id);
  await prisma.task.delete({ where: { id: task.id } });
  audit(req.user.id, 'TASK_DELETED', 'Task', task.id, { name: task.name });
  res.status(204).end();
}
