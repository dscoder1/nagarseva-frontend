import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ComplaintForm from '../components/ComplaintForm';
import toast from 'react-hot-toast';

const TYPES = [
  {
    id: 'garbage', icon: '🗑️', title: 'Garbage & Waste', tagClass: 'tag-garbage', tag: 'Sanitation',
    color: '#fef3c7', border: '#f59e0b',
    points: ['Illegal dumping on roadsides', 'Overflowing garbage bins', 'Waste near residential areas', 'Construction debris blocking roads'],
    impact: 'Health hazard, mosquito breeding, foul smell affecting residents',
  },
  {
    id: 'streetlight', icon: '💡', title: 'Street Light Issue', tagClass: 'tag-light', tag: 'Public Safety',
    color: '#fef9c3', border: '#eab308',
    points: ['Broken or damaged street lights', 'Lights not working at night', 'Flickering or unstable lights', 'New area without street lights'],
    impact: 'Accidents, theft, and safety risks for pedestrians and vehicles',
  },
  {
    id: 'water', icon: '💧', title: 'Water Wastage', tagClass: 'tag-water', tag: 'Water Supply',
    color: '#dbeafe', border: '#3b82f6',
    points: ['Broken government taps running continuously', 'Underground pipe leakage', 'Water logging due to pipeline burst', 'Tap not repaired for weeks'],
    impact: 'Thousands of litres wasted daily, pothole formation, water supply disruption',
  },
  {
    id: 'drainage', icon: '🚿', title: 'Drainage Problem', tagClass: 'tag-drain', tag: 'Sewerage',
    color: '#f3e8ff', border: '#a855f7',
    points: ['Drainage overflowing on road', 'Blocked sewage causing backflow', 'Foul smell from open drains', 'Drainage water in residential area'],
    impact: 'Disease spread, waterborne illness, environmental contamination',
  },
];

export default function Services({ onAuthClick }) {
  const { isLoggedIn } = useAuth();
  const [activeForm, setActiveForm] = useState(null);

  const handleReport = (id) => {
    if (!isLoggedIn) {
      toast.error('Please login to file a complaint');
      onAuthClick();
      return;
    }
    setActiveForm(id);
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', color: 'white', padding: '3.5rem 2rem', textAlign: 'center' }}>
        <div className="section-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>All Services</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem' }}>Report a Civic Issue</h1>
        <p style={{ opacity: 0.85, fontSize: '1.05rem', marginTop: '0.75rem', maxWidth: 500, margin: '0.75rem auto 0' }}>
          Choose the type of problem you want to report. Every complaint is tracked and resolved by our field supervisors.
        </p>
      </div>

      <div className="section">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {TYPES.map(t => (
            <div key={t.id} style={{ background: 'white', borderRadius: 20, padding: '2rem', boxShadow: 'var(--shadow)', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '2rem', alignItems: 'center', borderLeft: `6px solid ${t.border}` }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{t.icon}</div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', fontFamily: 'Syne, sans-serif' }}>{t.title}</div>
                <span className={`card-tag ${t.tagClass}`} style={{ marginTop: 8, display: 'inline-block' }}>{t.tag}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text)' }}>Common Issues:</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {t.points.map((p, i) => (
                    <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span> {p}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: '1rem', padding: '10px 14px', background: t.color, borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  ⚠️ <strong>Impact:</strong> {t.impact}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => handleReport(t.id)}
                  style={{ background: `linear-gradient(135deg, ${t.border}, ${t.border}cc)`, color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', width: '100%', fontFamily: 'DM Sans, sans-serif' }}
                >
                  📋 Report Now
                </button>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  {isLoggedIn ? 'Click to file complaint' : 'Login required'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeForm && <ComplaintForm type={activeForm} onClose={() => setActiveForm(null)} />}
    </div>
  );
}
