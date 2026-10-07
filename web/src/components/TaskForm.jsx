import { useState } from 'react';
import { LABELS, TASK_PRIORITY, TASK_STATUS, toDateInput, validateTask } from '@taskorbit/shared';
import { Field } from './ui.jsx';

export default function TaskForm({ initial, projectId, projects, onSubmit, onCancel }) {
  const [f, setF] = useState({
    projectId: initial?.projectId || projectId || projects?.[0]?.id || '',
    name: initial?.name || '', description: initial?.description || '',
    priority: initial?.priority || 'MEDIUM', status: initial?.status || 'PENDING', dueDate: toDateInput(initial?.dueDate),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const payload = { ...f, dueDate: f.dueDate || null };
    if (initial) delete payload.projectId; // tasks cannot move between projects
    const { errors: local } = validateTask(payload, { partial: !!initial });
    if (local) return setErrors(local);
    setBusy(true);
    try { await onSubmit(payload); } catch (err) { setErrors(err.details || { _: err.message }); setBusy(false); }
  }

  return (
    <form onSubmit={submit} noValidate>
      {errors._ && <div className="alert alert-error">{errors._}</div>}
      {!initial && !projectId && projects && (
        <Field label="Project" error={errors.projectId}>
          <select value={f.projectId} onChange={set('projectId')}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </Field>
      )}
      <Field label="Task name" error={errors.name}><input value={f.name} onChange={set('name')} maxLength={120} placeholder="e.g. Draft launch email" /></Field>
      <Field label="Description" error={errors.description}><textarea rows={3} value={f.description} onChange={set('description')} /></Field>
      <div className="row2">
        <Field label="Priority" error={errors.priority}>
          <select value={f.priority} onChange={set('priority')}>{TASK_PRIORITY.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}</select>
        </Field>
        <Field label="Status" error={errors.status}>
          <select value={f.status} onChange={set('status')}>{TASK_STATUS.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}</select>
        </Field>
      </div>
      <Field label="Due date" error={errors.dueDate}><input type="date" value={f.dueDate} onChange={set('dueDate')} /></Field>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add task'}</button>
      </div>
    </form>
  );
}
