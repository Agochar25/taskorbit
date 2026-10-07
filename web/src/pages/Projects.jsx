import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LABELS, PROJECT_STATUS, formatDate } from '@taskorbit/shared';
import { api, qs } from '../api/client.js';
import { useAsync, useDebounced } from '../hooks.js';
import { useToast } from '../context/ToastContext.jsx';
import { EmptyState, ErrorState, HealthBadge, Modal, Pagination, ProgressBar, Spinner, StatusBadge, healthColor } from '../components/ui.jsx';
import { Icon } from '../components/icons.jsx';
import ProjectForm from '../components/ProjectForm.jsx';

export default function Projects() {
  const nav = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const q = useDebounced(search);
  const [sortBy, order] = sort.split(':');
  const { data, loading, error, reload } = useAsync(() => api(`/projects${qs({ search: q, status, sortBy, order, page, limit: 9 })}`), [q, status, sort, page]);

  async function create(payload) {
    const r = await api('/projects', { method: 'POST', body: payload });
    toast('Project created');
    nav(`/projects/${r.data.id}`);
  }

  return (
    <div className="page">
      <header className="page-head"><div><h1>Projects</h1><p className="muted">Everything you own, with progress and health at a glance.</p></div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> New project</button></header>
      <div className="toolbar">
        <input type="search" placeholder="Search projects by name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search projects" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>{PROJECT_STATUS.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort projects">
          <option value="createdAt:desc">Newest first</option><option value="endDate:asc">Ending soonest</option><option value="name:asc">Name A-Z</option>
        </select>
      </div>

      {loading && !data ? <Spinner label="Loading projects" /> : error && !data ? <ErrorState error={error} onRetry={reload} /> : data.data.length === 0 ? (
        <EmptyState title={q || status ? 'No projects match your filters' : 'No projects yet'} hint={q || status ? 'Try clearing the search or filter.' : 'Create your first project to start adding tasks.'}
          action={!q && !status && <button className="btn btn-primary" onClick={() => setCreating(true)}>New project</button>} />
      ) : (
        <>
          <div className={`grid ${loading ? 'dim' : ''}`}>
            {data.data.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="project-card" style={{ '--hc': healthColor[p.health] }}>
                <div className="pc-top"><span className="pc-avatar" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span><div className="pc-badges"><StatusBadge value={p.status} /><HealthBadge value={p.health} /></div></div>
                <h3>{p.name}</h3>
                <p className="muted clamp">{p.description || 'No description'}</p>
                <div className="pc-progress"><ProgressBar value={p.progress} tone={healthColor[p.health]} /><b>{p.progress}%</b></div>
                <div className="pc-foot"><span><Icon name="tasks" size={14} /> {p.completedCount} of {p.taskCount} done</span><span className="muted"><Icon name="calendar" size={14} /> {p.endDate ? formatDate(p.endDate) : 'No end date'}</span></div>
              </Link>
            ))}
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
      {creating && <Modal title="New project" onClose={() => setCreating(false)}><ProjectForm onSubmit={create} onCancel={() => setCreating(false)} /></Modal>}
    </div>
  );
}