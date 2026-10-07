import { useState } from 'react';
import { LABELS, PROJECT_STATUS, toDateInput, validateProject } from '@taskorbit/shared';
import { Field } from './ui.jsx';

export default function ProjectForm({ initial, onSubmit, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '', description: initial?.description || '', status: initial?.status || 'NOT_STARTED',
    startDate: toDateInput(initial?.startDate), endDate: toDateInput(initial?.endDate),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const payload = { ...f, startDate: f.startDate || null, endDate: f.endDate || null };
    const { errors: local } = validateProject(payload);
    if (local) return setErrors(local);
    setBusy(true);
    try { await onSubmit(payload); } catch (err) { setErrors(err.details || { _: err.message }); setBusy(false); }
  }

  return (
    <form onSubmit={submit} noValidate>
      {errors._ && <div className="alert alert-error">{errors._}</div>}
      <Field label="Project name" error={errors.name}><input value={f.name} onChange={set('name')} maxLength={120} placeholder="e.g. Website relaunch" /></Field>
      <Field label="Description" error={errors.description}><textarea rows={3} value={f.description} onChange={set('description')} placeholder="What is this project about?" /></Field>
      <Field label="Status" error={errors.status}>
        <select value={f.status} onChange={set('status')}>{PROJECT_STATUS.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}</select>
      </Field>
      <div className="row2">
        <Field label="Start date" error={errors.startDate}><input type="date" value={f.startDate} onChange={set('startDate')} /></Field>
        <Field label="End date" error={errors.endDate}><input type="date" value={f.endDate} onChange={set('endDate')} /></Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create project'}</button>
      </div>
    </form>
  );
}
