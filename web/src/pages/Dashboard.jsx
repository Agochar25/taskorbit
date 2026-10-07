import { Link } from 'react-router-dom';
import { dueState, formatDate } from '@taskorbit/shared';
import { api } from '../api/client.js';
import { useAsync, useCountUp } from '../hooks.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorState, PriorityBadge, Spinner } from '../components/ui.jsx';
import { Icon } from '../components/icons.jsx';
import OrbitMap from '../components/OrbitMap.jsx';
import { describeActivity } from './Activity.jsx';

function timeAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

function Kpi({ icon, tone, label, value, sub, alert, i }) {
  const n = useCountUp(value);
  return (
    <div className={`kpi kpi-${tone} rise ${alert ? 'kpi-alert' : ''}`} style={{ '--i': i }}>
      <span className="kpi-icon"><Icon name={icon} size={20} /></span>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{n}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

function HeroRing({ pct }) {
  const r = 62; const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 160 160" className="hero-ring" role="img" aria-label={`${pct}% of tasks completed`}>
      <defs><linearGradient id="hr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7df3e1" /><stop offset="1" stopColor="#8ea0ff" /></linearGradient></defs>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="12" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="url(#hr)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 80 80)" />
      <text x="80" y="82" textAnchor="middle" className="hr-num">{pct}%</text>
      <text x="80" y="102" textAnchor="middle" className="hr-sub">complete</text>
    </svg>
  );
}

function Donut({ parts, total }) {
  const r = 58; const c = 2 * Math.PI * r; let acc = 0;
  return (
    <svg viewBox="0 0 160 160" className="donut" role="img" aria-label="Tasks by status">
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--mist)" strokeWidth="18" />
      {parts.map((p) => {
        const len = total ? (p.value / total) * c : 0;
        const el = len > 0 && (
          <circle key={p.label} cx="80" cy="80" r={r} fill="none" stroke={p.color} strokeWidth="18"
            strokeDasharray={`${Math.max(len - 3, 0.5)} ${c}`} strokeDashoffset={-acc} transform="rotate(-90 80 80)" />
        );
        acc += len;
        return el;
      })}
      <text x="80" y="80" textAnchor="middle" className="dn-num">{total}</text>
      <text x="80" y="99" textAnchor="middle" className="dn-sub">total tasks</text>
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(
    async () => {
      const [d, p] = await Promise.all([api('/dashboard'), api('/projects?limit=6&sortBy=createdAt&order=desc')]);
      return { stats: d.data, projects: p.data };
    }, [],
  );
  if (loading && !data) return <Spinner label="Loading dashboard" />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const { stats: s, projects } = data;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const attention = s.overdueTasks || s.dueTomorrow
    ? `${s.overdueTasks} overdue and ${s.dueTomorrow} due tomorrow.`
    : s.totalTasks ? 'Nothing is overdue. Nice work.' : 'Create a project and add your first task.';

  const kpis = [
    ['folder', 'blue', 'Total projects', s.totalProjects, 'Across your workspace'],
    ['zap', 'violet', 'Projects in progress', s.projectsInProgress, 'Active right now'],
    ['list', 'blue', 'Total tasks', s.totalTasks, `${s.inProgressTasks} in progress`],
    ['trend', 'teal', 'Completed tasks', s.completedTasks, `${s.completionRate}% completion rate`],
    ['clock', 'amber', 'Pending tasks', s.pendingTasks, 'Not started yet'],
  ];
  const parts = [
    { label: 'Completed', value: s.completedTasks, color: 'var(--teal)' },
    { label: 'In progress', value: s.inProgressTasks, color: 'var(--blue)' },
    { label: 'Pending', value: s.pendingTasks, color: 'var(--amber)' },
  ];
  const prio = [['HIGH', 'High', 'var(--coral)'], ['MEDIUM', 'Medium', 'var(--amber)'], ['LOW', 'Low', 'var(--teal)']];
  const maxPrio = Math.max(1, ...prio.map(([k]) => s.openByPriority[k]));

  return (
    <div className="page page-wide">
      <section className="hero-banner rise" style={{ '--i': 0 }}>
        <div className="hb-copy">
          <span className="hb-date"><Icon name="calendar" size={14} /> {today}</span>
          <h1>{greet}, {user.fullName.split(' ')[0]}</h1>
          <p>{attention}</p>
          <div className="hb-actions">
            <Link to="/projects" className="btn btn-light"><Icon name="plus" size={16} /> New project</Link>
            <Link to="/tasks" className="btn btn-outline-light">View my tasks <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
        <div className="hb-stats">
          <HeroRing pct={s.completionRate} />
          <ul>
            <li><b>{s.inProgressTasks}</b><span>in progress</span></li>
            <li className={s.overdueTasks ? 'hb-warn' : ''}><b>{s.overdueTasks}</b><span>overdue</span></li>
            <li><b>{s.dueTomorrow}</b><span>due tomorrow</span></li>
          </ul>
        </div>
      </section>

      <div className="kpi-grid">
        {kpis.map(([icon, tone, label, value, sub], i) => <Kpi key={label} icon={icon} tone={tone} label={label} value={value} sub={sub} i={i + 1} />)}
        <Kpi icon="alert" tone="coral" label="Overdue tasks" value={s.overdueTasks} sub={s.overdueTasks ? 'Needs attention' : 'All clear'} alert={s.overdueTasks > 0} i={6} />
      </div>

      <div className="hero">
        <section className="panel rise" style={{ '--i': 7 }}>
          <div className="panel-head"><h2>Project orbits</h2><span className="muted small">Ring length = progress · colour = health</span></div>
          <OrbitMap projects={projects} completionRate={s.completionRate} />
        </section>
        <section className="panel rise" style={{ '--i': 8 }}>
          <div className="panel-head"><h2>Task pipeline</h2><span className="muted small">By status</span></div>
          <div className="pipeline">
            <Donut parts={parts} total={s.totalTasks} />
            <ul className="pipe-legend">
              {parts.map((p) => <li key={p.label}><i style={{ background: p.color }} /><span className="grow">{p.label}</span><b>{p.value}</b></li>)}
            </ul>
          </div>
          <h3 className="sub-head">Open work by priority</h3>
          <ul className="prio">
            {prio.map(([k, label, color]) => (
              <li key={k}>
                <span className="prio-label">{label}</span>
                <div className="prio-track"><span style={{ width: `${(s.openByPriority[k] / maxPrio) * 100}%`, background: color }} /></div>
                <b>{s.openByPriority[k]}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="two-col">
        <section className="panel rise" style={{ '--i': 9 }}>
          <div className="panel-head"><h2>Focus: due in the next 7 days</h2><Link to="/tasks" className="small">All tasks</Link></div>
          {s.focusList.length === 0 ? <p className="muted">No open tasks with a due date this week.</p> : (
            <ul className="plain-list focus-list">
              {s.focusList.map((t) => (
                <li key={t.id}>
                  <span className={`focus-dot dot-${t.priority}`} aria-hidden="true" />
                  <div className="grow"><strong>{t.name}</strong><br /><Link className="muted small" to={`/projects/${t.project.id}`}>{t.project.name}</Link></div>
                  <PriorityBadge value={t.priority} />
                  <span className={`due due-chip due-${dueState(t.dueDate, t.status)}`}>{formatDate(t.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel rise" style={{ '--i': 10 }}>
          <div className="panel-head"><h2>Recent activity</h2><Link to="/activity" className="small">View all</Link></div>
          {s.recentActivity.length === 0 ? <p className="muted">Your actions will show up here.</p> : (
            <ul className="timeline">
              {s.recentActivity.map((a) => <li key={a.id}><span className="grow">{describeActivity(a)}</span><time className="muted small" title={new Date(a.createdAt).toLocaleString()}>{timeAgo(a.createdAt)}</time></li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}