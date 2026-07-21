import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

export default function AdminLayout() {
  const { user, logout, defaultPasswordWarning } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.className = 'admin-mode';
    document.documentElement.lang = 'de-CH';
    return () => { document.body.className = ''; };
  }, []);

  const doLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="admin-shell admin-header__inner">
          <div className="admin-brand"><strong>SENTINATORS GYM</strong><span>MAMA TIME BACKOFFICE</span></div>
          <button className="admin-menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>Menü</button>
          <nav className={menuOpen ? 'is-open' : ''} aria-label="Backoffice Navigation">
            <NavLink end to="/admin" onClick={() => setMenuOpen(false)}>Anfragen</NavLink>
            <NavLink to="/admin/settings" onClick={() => setMenuOpen(false)}><Icon name="settings" />Einstellungen</NavLink>
            <NavLink to="/admin/account" onClick={() => setMenuOpen(false)}>Konto</NavLink>
            <a href="/" target="_blank" rel="noopener">Landingpage öffnen</a>
            <button type="button" onClick={doLogout}><Icon name="logout" />Abmelden</button>
          </nav>
        </div>
      </header>
      {defaultPasswordWarning && <div className="admin-global-warning"><strong>Sicherheits-Hinweis:</strong> Das dokumentierte Standardpasswort ist noch aktiv. Bitte unter „Konto“ sofort ändern.</div>}
      <main className="admin-shell admin-main"><Outlet context={{ user }} /></main>
      <footer className="admin-footer"><div className="admin-shell">MAMA TIME React + Node Backoffice · geschützte PostgreSQL-Datenspeicherung</div></footer>
    </div>
  );
}
