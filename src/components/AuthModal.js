import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', password: '' });
  const { login } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await API.post(endpoint, form);
      login(data.token, data.user);
      toast.success(tab === 'login' ? `Welcome back, ${data.user.name}!` : `Account created! Welcome, ${data.user.name}!`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-logo">
          <h2>🏛️ NagarSeva</h2>
          <p>{tab === 'login' ? 'Welcome back! Login to your account' : 'Create your account to get started'}</p>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Login</button>
          <button className={`modal-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
            </div>
          )}
          <div className="form-group">
            <label>Mobile Number</label>
            <input name="mobile" placeholder="10-digit mobile number" value={form.mobile} onChange={handleChange} required maxLength={10} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="Enter password" value={form.password} onChange={handleChange} required />
          </div>
          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? '🔐 Login' : '✅ Create Account'}
          </button>
          <button className="btn-cancel" type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
