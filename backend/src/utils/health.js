/**
 * "Project health" - the signature feature of TaskOrbit.
 * Compares how far through its schedule a project is with how much work is done.
 *   DONE     project marked completed
 *   OVERDUE  end date passed and project not completed
 *   IDLE     no tasks yet
 *   AT_RISK  has overdue tasks, or progress is 25+ points behind the calendar
 *   ON_TRACK everything else
 */
export function projectHealth(project, { taskCount, completedCount, overdueCount }, now = new Date()) {
  if (project.status === 'COMPLETED') return 'DONE';
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (project.endDate && new Date(project.endDate) < today) return 'OVERDUE';
  if (taskCount === 0) return 'IDLE';
  if (overdueCount > 0) return 'AT_RISK';
  if (project.startDate && project.endDate) {
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    if (end > start && now.getTime() > start) {
      const elapsed = Math.min(100, ((now.getTime() - start) / (end - start)) * 100);
      const progress = (completedCount / taskCount) * 100;
      if (elapsed - progress >= 25) return 'AT_RISK';
    }
  }
  return 'ON_TRACK';
}
