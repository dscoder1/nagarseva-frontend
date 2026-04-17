import React, { useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TYPE_META = {
  garbage:     { label: 'Garbage & Waste', icon: '🗑️', color: '#92400e' },
  streetlight: { label: 'Street Light Issue', icon: '💡', color: '#713f12' },
  water:       { label: 'Water Wastage', icon: '💧', color: '#1e40af' },
  drainage:    { label: 'Drainage Problem', icon: '🚿', color: '#6b21a8' },
};

export default function ComplaintForm({ type, onClose, onSubmitted }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ location: '', description: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const meta = TYPE_META[type];

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFiles = e => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected].slice(0, 5));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('location', form.location);
      fd.append('description', form.description);
      files.forEach(f => fd.append('media', f));

      await API.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Complaint submitted successfully! 🎉');
      onSubmitted && onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    }
    setLoading(false);
  };

  return (
    <div className="complaint-form-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="complaint-form-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2.2rem' }}>{meta.icon}</span>
          <div>
            <div className="form-title" style={{ margin: 0 }}>File Complaint</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{meta.label}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name</label>
            <input value={user?.name || ''} readOnly style={{ background: '#f8fafc' }} />
          </div>
          <div className="form-group">
            <label>Mobile Number</label>
            <input value={user?.mobile || ''} readOnly style={{ background: '#f8fafc' }} />
          </div>
          <div className="form-group">
            <label>Location / Area *</label>
            <input name="location" placeholder="e.g. Near Ram Mandir, Sector 5, Gandhi Nagar" value={form.location} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Describe the Problem *</label>
            <textarea name="description" placeholder="Describe in detail what the issue is and how it is affecting people..." value={form.description} onChange={handleChange} required rows={4} />
          </div>
          <div className="form-group">
            <label>Upload Photos / Videos (optional, max 5)</label>
            <label className="upload-area" htmlFor="media-upload">
              <p>📁 Click to upload images or videos</p>
              <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Max 20MB per file</p>
              <input id="media-upload" type="file" multiple accept="image/*,video/*" onChange={handleFiles} style={{ display: 'none' }} />
            </label>
            {files.length > 0 && (
              <div className="upload-preview">
                {files.map((f, i) => (
                  f.type.startsWith('image/') ?
                    <img key={i} src={URL.createObjectURL(f)} alt="" className="upload-thumb" /> :
                    <div key={i} style={{ width: 60, height: 60, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🎥</div>
                ))}
              </div>
            )}
          </div>
          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? '⏳ Submitting...' : '📤 Submit Complaint'}
          </button>
          <button className="btn-cancel" type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
