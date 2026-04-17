import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider, useLang } from './context/LangContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AuthModal from './components/AuthModal';
import { Toaster } from 'react-hot-toast';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  const [page, setPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);

  const navigate = (p) => setPage(p);

  if (user?.role === 'admin') return (
    <>
      <Toaster position="top-right" />
      <AdminDashboard onLogout={() => setPage('home')} />
    </>
  );

  if (user?.role === 'supervisor') return (
    <>
      <Toaster position="top-right" />
      <SupervisorDashboard onLogout={() => setPage('home')} />
    </>
  );

  return (
    <div className="app">
      <Toaster position="top-right" />
      <Navbar onNavigate={navigate} currentPage={page} onAuthClick={() => setShowAuth(true)} />
      <main>
        {page === 'home' && <Home onNavigate={navigate} onAuthClick={() => setShowAuth(true)} />}
        {page === 'about' && <About />}
        {page === 'services' && <Services onAuthClick={() => setShowAuth(true)} />}
        {page === 'contact' && <Contact />}
        {page === 'dashboard' && user?.role === 'user' && <UserDashboard />}
        {page === 'dashboard' && !user && <Home onNavigate={navigate} onAuthClick={() => setShowAuth(true)} />}
      </main>
      <Footer />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); setPage('dashboard'); }} />}
    </div>
  );
}

function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <h3>🏛️ NagarikSeva</h3>
          <p>{t('footerTagline')}</p>
          <div className="footer-badges">
            <span>🟢 {t('systemActive')}</span>
            <span>📡 {t('monitoring')}</span>
          </div>
        </div>
        <div>
          <h4>{t('quickLinks')}</h4>
          <ul>
            <li>{t('footerHome')}</li><li>{t('footerAbout')}</li>
            <li>{t('footerComplaint')}</li><li>{t('footerTrack')}</li><li>{t('footerContact')}</li>
          </ul>
        </div>
        <div>
          <h4>{t('complaintTypes')}</h4>
          <ul>
            <li>🗑️ {t('garbage')}</li>
            <li>💡 {t('streetlight')}</li>
            <li>💧 {t('water')}</li>
            <li>🚿 {t('drainage')}</li>
          </ul>
        </div>
        <div>
          <h4>{t('contactAuthority')}</h4>
          <p>📍 {t('footerAddress')}</p>
          <p>📞 {t('footerPhone')}</p>
          <p>✉️ {t('footerEmail')}</p>
          <p>🕐 {t('footerHours')}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{t('footerCopy')}</p>
        <p>{t('footerPowered')}</p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <AppContent />
      </LangProvider>
    </AuthProvider>
  );
}
