import { useState } from 'react';
import { api } from '../api/client.js';
import { useAsync } from '../hooks.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ErrorState, Pagination, Spinner } from '../components/ui.jsx';
import { describeActivity } from './Activity.jsx';

export default function Admin() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('users');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => api(tab === 'users' ? `/admin/users?page=${page}&limit=15` : `/admin/audit-logs?page=${page}&limit=20`), [tab, page]);

  async function setRole(u, role) {
    try { await api(`/admin/users/${u.id}/role`, { method: 'PATCH', body: { role } }); toast('Role updated'); reload(); }
    catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div className="page">
      <header className="page-head"><div><h1>Admin</h1><p className="muted">Role-based access: only admins can see this page.</p></div>
        <div className="seg"><button className={tab === 'users' ? 'on' : ''} onClick={() => { setTab('users'); setPage(1); }}>Users</button><button className={tab === 'logs' ? 'on' : ''} onClick={() => { setTab('logs'); setPage(1); }}>Audit log</button></div></header>
      {loading && !data ? <Spinner /> : error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <section className="panel">
          {tab === 'users' ? (
            <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Projects</th><th>Role</th></tr></thead><tbody>
              {data.data.map((u) => <tr key={u.id}><td>{u.fullName}</td><td>{u.email}</td><td>{u._count.projects}</td>
                <td><select className="select-sm" value={u.role} disabled={u.id === me.id} onChange={(e) => setRole(u, e.target.value)} aria-label={`Role for ${u.email}`}><option>USER</option><option>ADMIN</option></select></td></tr>)}
            </tbody></table></div>
          ) : (
            <ul className="plain-list">{data.data.map((a) => <li key={a.id}><span className="grow">{describeActivity(a)} <span className="muted">by {a.user?.email || 'deleted user'}</span></span><time className="muted small">{new Date(a.createdAt).toLocaleString()}</time></li>)}</ul>
          )}
          <Pagination meta={data.meta} onPage={setPage} />
        </section>
      )}
    </div>
  );
}
