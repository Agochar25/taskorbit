import { useState } from 'react';
import { LABELS, TASK_PRIORITY, TASK_STATUS } from '@taskorbit/shared';
import { api, qs } from '../api/client.js';
import { useAsync, useDebounced } from '../hooks.js';
import { useToast } from '../context/ToastContext.jsx';
import { ConfirmDialog, EmptyState, ErrorState, Modal, Pagination, Spinner } from './ui.jsx';
import TaskRow from './TaskRow.jsx';
import TaskForm from './TaskForm.jsx';
import KanbanBoard from './KanbanBoard.jsx';
import { Icon } from './icons.jsx';

/** Search / filter / sort / paginate tasks. Used inside a project (projectId set) and on "My tasks". */
export default function TasksPanel({ projectId, onChanged }) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null); // null | {} (new) | task
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const q = useDebounced(search);
  const [sortBy, order] = sort.split(':');
  const board = view === 'board';
  const { data, loading, error, reload } = useAsync(
    () => api(`/tasks${qs({ projectId, search: q, status: board ? '' : status, priority, sortBy, order, page, limit: board ? 100 : 12 })}`),
    [projectId, q, status, priority, sort, page, view],
  );
  const projects = useAsync(() => (projectId ? Promise.resolve(null) : api('/projects?limit=100&sortBy=name&order=asc')), [projectId]);

  const reset = (setter) => (e) => { setter(e.target.value); setPage(1); };
  const refresh = () => { reload(); onChanged?.(); };

  async function save(payload) {
    if (editing.id) await api(`/tasks/${editing.id}`, { method: 'PUT', body: payload });
    else await api('/tasks', { method: 'POST', body: payload });
    toast(editing.id ? 'Task saved' : 'Task added');
    setEditing(null); refresh();
  }
  async function changeStatus(task, next) {
    try {
      await api(`/tasks/${task.id}`, { method: 'PUT', body: { status: next } });
      toast(next === 'COMPLETED' ? 'Task completed' : `Moved to ${LABELS[next].toLowerCase()}`);
      refresh();
    } catch (e) { toast(e.message, 'error'); }
  }
  async function confirmDelete() {
    setBusy(true);
    try { await api(`/tasks/${deleting.id}`, { method: 'DELETE' }); toast('Task deleted'); setDeleting(null); refresh(); }
    catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  }

  const tasks = data?.data || [];
  const filtered = q || status || priority;
  const noProjects = !projectId && projects.data && projects.data.data.length === 0;

  return (
    <section>
      <div className="toolbar">
        <input type="search" placeholder="Search tasks by name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search tasks" />
        {!board && (
          <select value={status} onChange={reset(setStatus)} aria-label="Filter by status">
            <option value="">All statuses</option>{TASK_STATUS.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
          </select>
        )}
        <select value={priority} onChange={reset(setPriority)} aria-label="Filter by priority">
          <option value="">All priorities</option>{TASK_PRIORITY.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
        </select>
        <select value={sort} onChange={reset(setSort)} aria-label="Sort tasks">
          <option value="createdAt:desc">Newest first</option><option value="dueDate:asc">Due soonest</option>
          <option value="priority:desc">Highest priority</option><option value="name:asc">Name A-Z</option>
        </select>
        {projectId && (
          <div className="seg" role="group" aria-label="View">
            <button className={!board ? 'on' : ''} onClick={() => setView('list')}>List</button>
            <button className={board ? 'on' : ''} onClick={() => setView('board')}>Board</button>
          </div>
        )}
        <button className="btn btn-primary" disabled={noProjects || (!projectId && !projects.data)} onClick={() => setEditing({})}><Icon name="plus" size={16} /> Add task</button>
      </div>

      {loading && !data ? <Spinner label="Loading tasks" />
        : error && !data ? <ErrorState error={error} onRetry={reload} />
        : noProjects ? <EmptyState title="Create a project first" hint="Tasks live inside projects." />
        : tasks.length === 0 ? (
          <EmptyState title={filtered ? 'No tasks match your filters' : 'No tasks yet'} hint={filtered ? 'Try clearing the search or filters.' : 'Add the first task to get moving.'} />
        ) : board ? (
          <KanbanBoard tasks={tasks} onStatus={changeStatus} onEdit={setEditing} />
        ) : (
          <>
            <ul className={`tasks ${loading ? 'dim' : ''}`}>
              {tasks.map((t) => <TaskRow key={t.id} task={t} showProject={!projectId} onToggle={(x) => changeStatus(x, x.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')} onStatus={changeStatus} onEdit={setEditing} onDelete={setDeleting} />)}
            </ul>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}

      {editing && (
        <Modal title={editing.id ? 'Edit task' : 'New task'} onClose={() => setEditing(null)}>
          <TaskForm initial={editing.id ? editing : null} projectId={projectId} projects={projects.data?.data} onSubmit={save} onCancel={() => setEditing(null)} />
          {editing.id && <button className="btn btn-ghost danger-text" onClick={() => { setDeleting(editing); setEditing(null); }}>Delete this task</button>}
        </Modal>
      )}
      {deleting && <ConfirmDialog title="Delete task?" message={`“${deleting.name}” will be removed permanently.`} busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </section>
  );
}
