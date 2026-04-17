import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Navbar({ onNavigate, currentPage, onAuthClick }) {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLang();

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => onNavigate('home')}>
        <span className="brand-icon">🏛️</span>
        <span>Nagar<span>Seva</span></span>
      </div>

      <div className="navbar-links">
        {[
          ['home', t('home')],
          ['about', t('about')],
          ['services', t('services')],
          ['contact', t('contact')],
        ].map(([page, label]) => (
          <button key={page} className={`nav-link ${currentPage === page ? 'active' : ''}`} onClick={() => onNavigate(page)}>
            {label}
          </button>
        ))}
        {user?.role === 'user' && (
          <button className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => onNavigate('dashboard')}>
            {t('myComplaints')}
          </button>
        )}
      </div>

      <div className="navbar-actions">
        <button className="lang-toggle" onClick={toggleLang} title="Switch Language / भाषा बदलें">
          <span className="lang-flag">{lang === 'en' ? '🇮🇳' : '🇬🇧'}</span>
          <span className="lang-label">{lang === 'en' ? 'हिंदी' : 'English'}</span>
        </button>

        {user ? (
          <>
            <span className="btn-user">👤 {user.name}</span>
            {user.role === 'user' && (
              <button className="btn-dashboard" onClick={() => onNavigate('dashboard')}>{t('dashboard')}</button>
            )}
            <button className="btn-auth btn-login" onClick={logout}>{t('logout')}</button>
          </>
        ) : (
          <>
            <button className="btn-auth btn-login" onClick={onAuthClick}>{t('login')}</button>
            <button className="btn-auth btn-signup" onClick={onAuthClick}>{t('signUp')}</button>
          </>
        )}
      </div>
    </nav>
  );
}
