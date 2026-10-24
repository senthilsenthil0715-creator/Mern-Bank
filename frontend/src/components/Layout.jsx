import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const links = [
    ['/', 'Overview'],
    ['/payments', 'Payments'],
    ['/transactions', 'Statements'],
    ['/settings', 'Settings']
  ];
  if (user.role === 'admin') links.push(['/admin', 'Admin console']);

  return (
    <div className="shell">
      <aside className={`side ${open ? 'open' : ''}`}>
        <div className="brand"><span className="mark">N</span> Nexa Bank</div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button className="btn ghost sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <button className="btn ghost sm" onClick={() => { logout(); nav('/login'); }}>Sign out</button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="btn ghost sm menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">Menu</button>
          <span className="hello">Welcome back, {user.name.split(' ')[0]}</span>
        </header>
        {user.status === 'frozen' && (
          <div className="banner">Your account is frozen. You can view your history but cannot move money.</div>
        )}
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
