import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '@taskorbit/shared';
import { api } from '../api/client.js';
import { useAsync } from '../hooks.js';
import { useToast } from '../context/ToastContext.jsx';
import { ConfirmDialog, ErrorState, HealthBadge, Modal, ProgressBar, Spinner, StatusBadge, healthColor } from '../components/ui.jsx';
import ProjectForm from '../components/ProjectForm.jsx';
import TasksPanel from '../components/TasksPanel.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api(`/projects/${id}`), [id]);

  if (loading && !data) return <Spinner label="Loading project" />;
  if (error && !data) {
    return error.status === 404
      ? <div className="page"><ErrorState error={{ message: 'This project does not exist or was deleted.' }} onRetry={() => nav('/projects')} /></div>
      : <ErrorState error={error} onRetry={reload} />;
  }
  const p = data.data;

  async function save(payload) {
    await api(`/projects/${id}`, { method: 'PUT', body: payload });
    toast('Project saved'); setEditing(false); reload();
  }
  async function remove() {
    setBusy(true);
    try { await api(`/projects/${id}`, { method: 'DELETE' }); toast('Project deleted'); nav('/projects'); }
    catch (e) { toast(e.message, 'error'); setBusy(false); }
  }

  return (
    <div className="page">
      <Link to="/projects" className="muted back">&larr; Back to projects</Link>
      <header className="page-head">
        <div>
          <h1>{p.name}</h1>
          <div className="task-meta"><StatusBadge value={p.status} /><HealthBadge value={p.health} />
            <span className="muted">{p.startDate ? formatDate(p.startDate) : 'No start'} to {p.endDate ? formatDate(p.endDate) : 'no end date'}</span></div>
          {p.description && <p className="lead">{p.description}</p>}
        </div>
        <div className="row-actions">
          <button className="btn" onClick={() => setEditing(true)}>Edit project</button>
          <button className="btn btn-ghost danger-text" onClick={() => setDeleting(true)}>Delete</button>
        </div>
      </header>
      <div className="panel progress-panel">
        <div className="grow"><ProgressBar value={p.progress} tone={healthColor[p.health]} /></div>
        <strong>{p.progress}%</strong><span className="muted">{p.completedCount} of {p.taskCount} tasks done{p.overdueCount ? `, ${p.overdueCount} overdue` : ''}</span>
      </div>
      <TasksPanel projectId={id} onChanged={reload} />
      {editing && <Modal title="Edit project" onClose={() => setEditing(false)}><ProjectForm initial={p} onSubmit={save} onCancel={() => setEditing(false)} /></Modal>}
      {deleting && <ConfirmDialog title="Delete project?" message={`“${p.name}” and all ${p.taskCount} of its tasks will be removed permanently.`} busy={busy} onConfirm={remove} onCancel={() => setDeleting(false)} />}
    </div>
  );
}
