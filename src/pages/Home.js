import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ComplaintForm from '../components/ComplaintForm';
import toast from 'react-hot-toast';

const COMPLAINT_TYPES = [
  {
    id: 'garbage',
    icon: '🗑️',
    title: 'Garbage & Waste',
    desc: 'Report illegal dumping, overflowing bins, or roadside waste accumulation affecting your area.',
    tag: 'Sanitation',
    tagClass: 'tag-garbage',
    color: '#fef3c7',
    border: '#f59e0b',
  },
  {
    id: 'streetlight',
    icon: '💡',
    title: 'Street Light Issue',
    desc: 'Report broken, flickering, or non-functional street lights creating unsafe conditions at night.',
    tag: 'Public Safety',
    tagClass: 'tag-light',
    color: '#fef9c3',
    border: '#eab308',
  },
  {
    id: 'water',
    icon: '💧',
    title: 'Water Wastage',
    desc: 'Report broken government taps, pipeline leaks, or continuous water wastage in public areas.',
    tag: 'Water Supply',
    tagClass: 'tag-water',
    color: '#dbeafe',
    border: '#3b82f6',
  },
  {
    id: 'drainage',
    icon: '🚿',
    title: 'Drainage Problem',
    desc: 'Report overflowing drains, blocked sewage, or foul-smelling drainage causing health hazards.',
    tag: 'Sewerage',
    tagClass: 'tag-drain',
    color: '#f3e8ff',
    border: '#a855f7',
  },
];

export default function Home({ onNavigate, onAuthClick }) {
  const { user, isLoggedIn } = useAuth();
  const [activeForm, setActiveForm] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCardClick = (typeId) => {
    if (!isLoggedIn) {
      toast.error('Please login to file a complaint');
      onAuthClick();
      return;
    }
    setActiveForm(typeId);
  };

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">
            <span>🟢</span> Serving Citizens 24/7
          </div>
          <h1>
            Your City. Your Voice.<br />
            <span className="highlight">Make It Heard.</span>
          </h1>
          <p>
            File complaints about civic issues directly to the municipal authority. Track resolution in real-time and hold the system accountable.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => onNavigate('services')}>
              📋 File a Complaint
            </button>
            <button className="btn-hero-outline" onClick={() => isLoggedIn ? onNavigate('dashboard') : onAuthClick()}>
              {isLoggedIn ? '📊 Track My Complaints' : '🔐 Login / Sign Up'}
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="num">4</div><div className="label">Issue Categories</div></div>
            <div className="hero-stat"><div className="num">24h</div><div className="label">Avg Response</div></div>
            <div className="hero-stat"><div className="num">100%</div><div className="label">Transparent</div></div>
            <div className="hero-stat"><div className="num">Free</div><div className="label">For Citizens</div></div>
          </div>
        </div>
      </section>

      {/* COMPLAINT TYPE CARDS */}
      <div style={{ background: 'white', padding: '3.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-badge">Services</div>
            <h2>What Would You Like to Report?</h2>
            <p>Select the type of civic issue you want to report. Our team will ensure it reaches the right authority.</p>
          </div>
          <div className="cards-grid">
            {COMPLAINT_TYPES.map(ct => (
              <div
                key={ct.id}
                className="complaint-card"
                style={{ borderTop: `4px solid ${ct.border}`, background: ct.color }}
                onClick={() => handleCardClick(ct.id)}
              >
                <div className="card-icon">{ct.icon}</div>
                <div>
                  <div className="card-title">{ct.title}</div>
                  <div className="card-desc">{ct.desc}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`card-tag ${ct.tagClass}`}>{ct.tag}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>Click to Report →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '3.5rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div className="section-header">
          <div className="section-badge">Process</div>
          <h2>How Does It Work?</h2>
          <p>Simple, transparent and effective complaint resolution system</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { step: '01', icon: '🔐', title: 'Create Account', desc: 'Register with your mobile number to start filing complaints' },
            { step: '02', icon: '📋', title: 'File Complaint', desc: 'Select issue type, add location and upload evidence photos' },
            { step: '03', icon: '👷', title: 'Gets Assigned', desc: 'Admin assigns complaint to the area supervisor for action' },
            { step: '04', icon: '✅', title: 'Issue Resolved', desc: 'Supervisor resolves issue and you get notified in your profile' },
          ].map(s => (
            <div key={s.step} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: 2, marginBottom: 8 }}>STEP {s.step}</div>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{s.icon}</div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontFamily: 'Syne, sans-serif' }}>{s.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA BANNER */}
      <div style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #ea580c 100%)', padding: '3rem 2rem', textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to Make Your City Better?</h2>
        <p style={{ opacity: 0.9, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Join thousands of citizens who are actively improving their neighborhoods</p>
        <button className="btn-hero-outline" onClick={() => isLoggedIn ? onNavigate('services') : onAuthClick()} style={{ borderColor: 'white', color: 'white' }}>
          {isLoggedIn ? '📋 File a Complaint Now' : '🚀 Get Started Free'}
        </button>
      </div>

      {activeForm && (
        <ComplaintForm
          type={activeForm}
          onClose={() => setActiveForm(null)}
          onSubmitted={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
