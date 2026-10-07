import { prisma } from '../config/prisma.js';

const dayUtc = (offset = 0) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
};

/**
 * Everything is scoped to the authenticated user.
 * "pendingTasks" = tasks whose status is PENDING (not started); in-progress tasks are reported separately.
 */
export async function getDashboard(req, res) {
  const owned = { project: { ownerId: req.user.id } };
  const notDone = { status: { not: 'COMPLETED' } };
  const [totalProjects, projectsInProgress, totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks, dueTomorrow, byPriority, dueSoon, recentActivity] =
    await Promise.all([
      prisma.project.count({ where: { ownerId: req.user.id } }),
      prisma.project.count({ where: { ownerId: req.user.id, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: owned }),
      prisma.task.count({ where: { ...owned, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...owned, status: 'PENDING' } }),
      prisma.task.count({ where: { ...owned, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...owned, ...notDone, dueDate: { lt: dayUtc(0) } } }),
      prisma.task.count({ where: { ...owned, ...notDone, dueDate: { gte: dayUtc(1), lt: dayUtc(2) } } }),
      prisma.task.groupBy({ by: ['priority'], where: { ...owned, ...notDone }, _count: { _all: true } }),
      prisma.task.findMany({
        where: { ...owned, ...notDone, dueDate: { lt: dayUtc(8) } },
        orderBy: { dueDate: 'asc' },
        take: 6,
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.auditLog.findMany({ where: { userId: req.user.id, entity: { in: ['Task', 'Project'] } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

  res.json({
    data: {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
      inProgressTasks,
      overdueTasks,
      dueTomorrow,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      openByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, ...Object.fromEntries(byPriority.map((r) => [r.priority, r._count._all])) },
      focusList: dueSoon,
      recentActivity,
    },
  });
}
