import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { validateLogin, validateRegister } from '@taskorbit/shared';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../components/icons.jsx';
import { Field } from '../components/ui.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register, notice, setNotice } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const { errors: local } = (isRegister ? validateRegister : validateLogin)(f);
    if (local) return setErrors(local);
    setBusy(true); setErrors({}); setNotice('');
    try {
      if (isRegister) await register(f.fullName, f.email, f.password); else await login(f.email, f.password);
      nav('/', { replace: true });
    } catch (err) {
      setErrors(err.details || { _: err.message });
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="auth-brand"><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="none" stroke="#a5b4ff" strokeWidth="3" /><circle cx="25" cy="9" r="4" fill="#f2a33a" /></svg>TaskOrbit</div>
        <svg viewBox="0 0 300 300" aria-hidden="true" className="auth-orbit">
          {[120, 92, 64].map((r, i) => <circle key={r} cx="150" cy="150" r={r} fill="none" stroke="#8ea0ff" strokeOpacity={0.35 + i * 0.2} strokeWidth="2" strokeDasharray={i === 1 ? '3 9' : undefined} />)}
          <g className="spin-slow"><circle cx="270" cy="150" r="9" fill="#f2a33a" /></g>
          <g className="spin-med"><circle cx="150" cy="58" r="6" fill="#12b5a6" /></g>
          <g className="spin-fast"><circle cx="150" cy="214" r="6" fill="#fff" /></g>
        </svg>
        <h1>Keep every project in orbit.</h1>
        <p>Plan projects, track tasks and see what needs attention. Same account on the web and on your phone.</p>
        <ul className="auth-points">
          <li><Icon name="check" size={16} /> Kanban board with drag &amp; drop</li>
          <li><Icon name="check" size={16} /> Project health at a glance</li>
          <li><Icon name="check" size={16} /> Web and mobile, always in sync</li>
        </ul>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        {notice && <div className="alert alert-warn" role="alert">{notice}</div>}
        {errors._ && <div className="alert alert-error" role="alert">{errors._}</div>}
        {isRegister && <Field label="Full name" error={errors.fullName}><input autoComplete="name" value={f.fullName} onChange={set('fullName')} /></Field>}
        <Field label="Email" error={errors.email}><input type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Password" error={errors.password}><input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} /></Field>
        {isRegister && <small className="muted">At least 8 characters with a letter and a number.</small>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button>
        <p className="muted center">{isRegister ? 'Already have an account?' : 'New to TaskOrbit?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p>
      </form>
    </div>
  );
}