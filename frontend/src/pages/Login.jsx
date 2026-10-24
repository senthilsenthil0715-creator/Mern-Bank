import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';

export default function Login({ register }) {
  const { login, register: signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await (register ? signup(f) : login({ email: f.email, password: f.password }));
      nav('/');
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="brand big"><span className="mark">N</span> Nexa Bank</div>
        <h1>Money that moves<br />at your pace.</h1>
        <p>Open an account in under a minute, send money to anyone with an account number, and see exactly where every rupee went.</p>
        <ul>
          <li>Instant transfers between Nexa accounts</li>
          <li>Monthly income and spending insights</li>
          <li>Saved payees and downloadable statements</li>
        </ul>
      </section>
      <form className="auth-form" onSubmit={submit}>
        <h2>{register ? 'Open your account' : 'Sign in'}</h2>
        {err && <div className="alert" role="alert">{err}</div>}
        {register && (
          <label>Full name<input value={f.name} onChange={set('name')} required autoComplete="name" /></label>
        )}
        <label>Email<input type="email" value={f.email} onChange={set('email')} required autoComplete="email" /></label>
        <label>Password<input type="password" value={f.password} onChange={set('password')} required minLength={6} autoComplete={register ? 'new-password' : 'current-password'} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
        <p className="muted">
          {register ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New to Nexa? <Link to="/register">Open an account</Link></>}
        </p>
        {!register && <p className="hint">Demo admin: admin@nexabank.com / Admin@123</p>}
      </form>
    </div>
  );
}
