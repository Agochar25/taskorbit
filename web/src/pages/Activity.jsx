import { useState } from 'react';
import { api } from '../api/client.js';
import { useAsync } from '../hooks.js';
import { ErrorState, Pagination, Spinner } from '../components/ui.jsx';

const VERBS = {
  PROJECT_CREATED: 'Created project', PROJECT_UPDATED: 'Updated project', PROJECT_DELETED: 'Deleted project',
  TASK_CREATED: 'Created task', TASK_UPDATED: 'Updated task', TASK_COMPLETED: 'Completed task', TASK_DELETED: 'Deleted task',
  USER_REGISTERED: 'Created account', USER_LOGGED_IN: 'Logged in', USER_LOGGED_OUT: 'Logged out', ROLE_CHANGED: 'Role changed',
};
export const describeActivity = (a) => `${VERBS[a.action] || a.action}${a.meta?.name ? `: ${a.meta.name}` : ''}`;

export default function Activity() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => api(`/activity?page=${page}&limit=20`), [page]);
  return (
    <div className="page">
      <header className="page-head"><div><h1>Activity</h1><p className="muted">An audit trail of everything done on your account, from web or mobile.</p></div></header>
      {loading && !data ? <Spinner /> : error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <section className="panel">
          <ul className="plain-list">
            {data.data.map((a) => <li key={a.id}><span className="grow">{describeActivity(a)}</span>{a.meta?.client && <span className="badge badge-neutral">{a.meta.client}</span>}<time className="muted small">{new Date(a.createdAt).toLocaleString()}</time></li>)}
          </ul>
          <Pagination meta={data.meta} onPage={setPage} />
        </section>
      )}
    </div>
  );
}
