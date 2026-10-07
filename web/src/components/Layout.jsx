import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from './icons.jsx';

const Mark = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
    <defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a5b4ff" /><stop offset="1" stopColor="#5b7bff" /></linearGradient></defs>
    <circle cx="16" cy="16" r="11" fill="none" stroke="url(#mk)" strokeWidth="3" /><circle cx="25" cy="9" r="4" fill="#f2a33a" />
  </svg>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('taskorbit.theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('taskorbit.theme', theme); }, [theme]);
  const link = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;
  const item = (to, icon, label, end) => <NavLink to={to} end={end} className={link}><Icon name={icon} /><span>{label}</span></NavLink>;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><Mark /><span>TaskOrbit</span></div>
        <div className="nav-label">Workspace</div>
        <nav aria-label="Main">
          {item('/', 'dashboard', 'Dashboard', true)}
          {item('/projects', 'folder', 'Projects')}
          {item('/tasks', 'tasks', 'My tasks')}
          {item('/activity', 'activity', 'Activity')}
          {user.role === 'ADMIN' && item('/admin', 'shield', 'Admin')}
        </nav>
        <button className="nav-link theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} /><span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <div className="me">
          <div className="avatar" aria-hidden="true">{user.fullName.slice(0, 1).toUpperCase()}</div>
          <div className="me-text"><strong>{user.fullName}</strong><small>{user.email}</small></div>
          <button className="btn btn-ghost btn-sm on-dark" onClick={logout}><Icon name="logout" size={15} /> Log out</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}