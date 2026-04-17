import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function Contact() {
  const { user, isLoggedIn } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', mobile: user?.mobile || '', message: '' });
  const [loading, setLoading] = useState(false);
  const [myMessages, setMyMessages] = useState([]);

  useEffect(() => {
    if (isLoggedIn) {
      API.get('/contact/my').then(r => setMyMessages(r.data)).catch(() => {});
      setForm(f => ({ ...f, name: user?.name || '', mobile: user?.mobile || '' }));
    }
  }, [isLoggedIn]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login to send a message'); return; }
    setLoading(true);
    try {
      await API.post('/contact', form);
      toast.success('Message sent successfully! We will get back to you.');
      setForm(f => ({ ...f, message: '' }));
      const r = await API.get('/contact/my');
      setMyMessages(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', color: 'white', padding: '3.5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Contact Us</h1>
        <p style={{ opacity: 0.85, marginTop: '0.75rem', fontSize: '1.05rem' }}>Have a query, suggestion, or feedback? We'd love to hear from you.</p>
      </div>

      <div className="section">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
              Our team is available Monday to Saturday during office hours. You can also reach us through the form and we'll respond within 24 hours.
            </p>
            {[
              { icon: '📍', title: 'Office Address', val: 'Municipal Corporation Office, City Hall, Main Road, City - 110001' },
              { icon: '📞', title: 'Helpline (Toll Free)', val: '1800-XXX-XXXX\nMon–Sat: 9AM – 6PM' },
              { icon: '✉️', title: 'Email', val: 'grievance@nagarik.gov.in\nfeedback@nagarik.gov.in' },
              { icon: '⚡', title: 'Emergency', val: 'For urgent issues call municipal control room: 100 (Police)\nAmbulance: 108' },
            ].map((item, i) => (
              <div key={i} className="contact-info-item">
                <div className="contact-icon">{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{item.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="contact-form-card">
              <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontFamily: 'Syne, sans-serif', fontSize: '1.2rem' }}>
                💬 Send Us a Message
              </h3>
              {!isLoggedIn && (
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '12px 16px', marginBottom: '1.2rem', fontSize: '0.88rem', color: '#92400e' }}>
                  ⚠️ Please login to send a message and track your queries.
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" required readOnly={isLoggedIn} style={isLoggedIn ? { background: '#f8fafc' } : {}} />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit mobile" required maxLength={10} readOnly={isLoggedIn} style={isLoggedIn ? { background: '#f8fafc' } : {}} />
                </div>
                <div className="form-group">
                  <label>Your Message</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Write your query, suggestion, or feedback here..." rows={5} required />
                </div>
                <button className="btn-submit" type="submit" disabled={loading || !isLoggedIn}>
                  {loading ? '⏳ Sending...' : '📤 Send Message'}
                </button>
              </form>
            </div>

            {isLoggedIn && myMessages.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontFamily: 'Syne, sans-serif' }}>Your Previous Messages</h3>
                {myMessages.map(m => (
                  <div key={m._id} style={{ background: 'white', borderRadius: 12, padding: '1.2rem', boxShadow: 'var(--shadow)', marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                      {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.6 }}>{m.message}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 50, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600 }}>✅ Received</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
