import { useEffect, useRef } from 'react';
import { LABELS } from '@taskorbit/shared';

export const Spinner = ({ label = 'Loading' }) => (
  <div className="center-box" role="status"><span className="spinner" aria-hidden="true" /><span className="muted">{label}…</span></div>
);

export const Badge = ({ tone = 'neutral', children }) => <span className={`badge badge-${tone}`}>{children}</span>;

const statusTone = { NOT_STARTED: 'neutral', PENDING: 'neutral', IN_PROGRESS: 'blue', COMPLETED: 'teal' };
const priorityTone = { LOW: 'neutral', MEDIUM: 'amber', HIGH: 'coral' };
const healthTone = { ON_TRACK: 'teal', DONE: 'teal', AT_RISK: 'amber', OVERDUE: 'coral', IDLE: 'neutral' };

export const StatusBadge = ({ value }) => <Badge tone={statusTone[value]}>{LABELS[value]}</Badge>;
export const PriorityBadge = ({ value }) => <Badge tone={priorityTone[value]}>{LABELS[value]} priority</Badge>;
export const HealthBadge = ({ value }) => <Badge tone={healthTone[value]}>{LABELS[value]}</Badge>;
export const healthColor = { ON_TRACK: 'var(--teal)', DONE: 'var(--teal)', AT_RISK: 'var(--amber)', OVERDUE: 'var(--coral)', IDLE: 'var(--ink-3)' };

export const ProgressBar = ({ value, tone }) => (
  <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${value}%`, background: tone }} />
  </div>
);

export function EmptyState({ title, hint, action }) {
  return (
    <div className="empty">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="none" stroke="var(--line)" strokeWidth="3" strokeDasharray="4 6" /><circle cx="50" cy="20" r="5" fill="var(--amber)" /></svg>
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const offline = error?.code === 'NETWORK';
  return (
    <div className="empty error-state" role="alert">
      <h3>{offline ? "You're offline" : 'Something went wrong'}</h3>
      <p className="muted">{error?.message || 'Please try again.'}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <button className="btn btn-ghost" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</button>
      <span className="muted">Page {meta.page} of {meta.totalPages}</span>
      <button className="btn btn-ghost" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</button>
    </nav>
  );
}

export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('input,textarea,select,button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close">×</button></header>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Deleting…' : confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
