import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import API from '../utils/api';
import { generatePDF } from '../utils/pdfReport';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STATUS_COLORS = { pending:'#f59e0b', assigned:'#3b82f6', 'in-progress':'#0891b2', solved:'#16a34a', rejected:'#dc2626' };
const STATUS_BG     = { pending:'#fef3c7', assigned:'#dbeafe', 'in-progress':'#e0f2fe', solved:'#dcfce7', rejected:'#fee2e2' };
const TYPE_ICONS    = { garbage:'🗑️', streetlight:'💡', water:'💧', drainage:'🚿' };
const TYPE_COLORS   = { garbage:'#f59e0b', streetlight:'#eab308', water:'#3b82f6', drainage:'#a855f7' };
const TYPE_LABELS   = { garbage:'Garbage', streetlight:'Street Light', water:'Water', drainage:'Drainage' };

const PERIODS = [
  { key:'all',       en:'All Time',     hi:'सभी समय' },
  { key:'today',     en:'Today',        hi:'आज' },
  { key:'yesterday', en:'Yesterday',    hi:'कल' },
  { key:'last10',    en:'Last 10 Days', hi:'पिछले 10 दिन' },
  { key:'month',     en:'Last Month',   hi:'पिछला महीना' },
  { key:'custom',    en:'Custom',       hi:'कस्टम' },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { lang, t } = useLang();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [supForm, setSupForm] = useState({ name:'', mobile:'', password:'', area:'' });

  // Complaint filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Report filters
  const [period, setPeriod] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedSup, setSelectedSup] = useState('');

  useEffect(() => { loadStats(); }, []);
  useEffect(() => {
    if (tab === 'complaints') loadComplaints();
    if (tab === 'users') { loadUsers(); loadSupervisors(); }
    if (tab === 'contacts') loadContacts();
    if (tab === 'supervisors') loadSupervisors();
    if (tab === 'report') { loadSupervisors(); fetchReport(); }
  }, [tab]);

  const loadStats = async () => { try { const r = await API.get('/admin/stats'); setStats(r.data); } catch {} };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      let url = '/admin/complaints?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterType)   url += `type=${filterType}&`;
      if (filterFrom)   url += `from=${filterFrom}&`;
      if (filterTo)     url += `to=${filterTo}&`;
      const r = await API.get(url);
      setComplaints(r.data);
    } catch {}
    setLoading(false);
  };

  const loadUsers        = async () => { try { const r = await API.get('/admin/users');       setUsers(r.data);       } catch {} };
  const loadSupervisors  = async () => { try { const r = await API.get('/admin/supervisors');  setSupervisors(r.data); } catch {} };
  const loadContacts     = async () => { try { const r = await API.get('/admin/contacts');     setContacts(r.data);    } catch {} };

  const fetchReport = async () => {
    try {
      let url = '/admin/report?';
      if (period !== 'all' && period !== 'custom') url += `period=${period}&`;
      if (period === 'custom' && from) url += `from=${from}&`;
      if (period === 'custom' && to)   url += `to=${to}&`;
      const r = await API.get(url);
      setReport(r.data);
    } catch {}
  };

  const handlePDF = async () => {
    if (!report) { toast.error('Generate report first'); return; }
    setPdfLoading(true);
    try {
      generatePDF({ role:'admin', reportData:report, user:{ name:'Administrator', mobile:'' }, period, from, to, lang });
      toast.success(t('reportGenerated'));
    } catch { toast.error('PDF failed'); }
    setPdfLoading(false);
  };

  const updateStatus = async (id, status, extra = {}) => {
    try {
      await API.put(`/admin/complaints/${id}`, { status, ...extra });
      toast.success(`Complaint marked as ${status}`);
      loadComplaints(); loadStats();
    } catch { toast.error('Failed to update'); }
  };

  const addSupervisor = async e => {
    e.preventDefault();
    try {
      await API.post('/admin/supervisors', supForm);
      toast.success('Supervisor added!');
      setSupForm({ name:'', mobile:'', password:'', area:'' });
      loadSupervisors();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const deleteSupervisor = async id => {
    if (!window.confirm('Delete this supervisor?')) return;
    try { await API.delete(`/admin/supervisors/${id}`); toast.success('Deleted'); loadSupervisors(); } catch {}
  };

  const pl = item => lang === 'hi' ? item.hi : item.en;

  const pieData = report?.byStatus
    ? Object.entries(report.byStatus).map(([k,v]) => ({ name:k, value:v, color:STATUS_COLORS[k] })).filter(d => d.value > 0)
    : [];
  const barData = report?.byType
    ? Object.entries(report.byType).map(([k,v]) => ({ name:TYPE_LABELS[k]||k, count:v, fill:TYPE_COLORS[k] }))
    : [];

  const NAV_ITEMS = [
    ['overview',    '📊', t('overview')],
    ['complaints',  '📋', t('complaints')],
    ['supervisors', '👷', t('supervisors')],
    ['users',       '👥', t('users')],
    ['contacts',    '💬', t('contacts')],
    ['report',      '📈', t('reports')],
  ];

  return (
    <div className="dashboard">
      <div className="dash-layout">
        {/* SIDEBAR */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar-brand">🏛️ {t('adminPanel')}</div>
          {NAV_ITEMS.map(([key,icon,label]) => (
            <button key={key} className={`dash-nav-btn ${tab===key?'active':''}`} onClick={() => setTab(key)}>
              <span>{icon}</span> {label}
            </button>
          ))}
          <div style={{ flex:1 }}/>
          <button className="dash-nav-btn logout" onClick={logout}><span>🚪</span> {t('logout')}</button>
        </aside>

        <div className="dash-content">

          {/* ── OVERVIEW ── */}
          {tab==='overview' && (
            <>
              <div className="dash-header"><h1>{t('dashboardOverview')}</h1><p>{t('dashboardDesc')}</p></div>
              <div className="stats-grid">
                {[
                  { icon:'📋', num:stats.total||0,       label:t('totalComplaints'), color:'var(--primary)' },
                  { icon:'✅', num:stats.solved||0,       label:t('resolved'),        color:'var(--success)' },
                  { icon:'⏳', num:stats.pending||0,      label:t('pending'),          color:'var(--warning)' },
                  { icon:'🔵', num:stats.assigned||0,     label:t('statusAssigned'),   color:'var(--info)'    },
                  { icon:'❌', num:stats.rejected||0,     label:t('rejected'),         color:'var(--danger)'  },
                  { icon:'👥', num:stats.users||0,        label:t('citizens'),         color:'#7c3aed'        },
                  { icon:'👷', num:stats.supervisors||0,  label:t('supervisors'),      color:'var(--info)'    },
                ].map((s,i) => (
                  <div key={i} className="stat-card">
                    <div className="s-icon">{s.icon}</div>
                    <div className="s-num" style={{ color:s.color }}>{s.num}</div>
                    <div className="s-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'var(--shadow)', marginTop:'1rem' }}>
                <h3 style={{ color:'var(--primary)', marginBottom:'1rem', fontFamily:'Syne,sans-serif' }}>Quick Navigation</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem' }}>
                  {NAV_ITEMS.slice(1).map(([key,icon,label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{ background:'var(--bg)', border:'2px solid var(--border)', borderRadius:12, padding:'1rem', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'var(--primary)', fontSize:'0.9rem' }}>
                      <div style={{ fontSize:'1.5rem', marginBottom:6 }}>{icon}</div>{label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── COMPLAINTS ── */}
          {tab==='complaints' && (
            <>
              <div className="dash-header"><h1>{t('allComplaints')}</h1><p>{t('manageComplaints')}</p></div>
              <div className="filters" style={{ marginBottom:'1rem' }}>
                <select className="action-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">{t('allStatus')}</option>
                  {['pending','assigned','in-progress','solved','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="action-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">{t('allTypes')}</option>
                  {['garbage','streetlight','water','drainage'].map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <input type="date" className="action-select" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                <input type="date" className="action-select" value={filterTo}   onChange={e => setFilterTo(e.target.value)} />
                <button className="filter-btn active" onClick={loadComplaints}>🔍 {t('filter')}</button>
                <button className="filter-btn" onClick={() => { setFilterStatus(''); setFilterType(''); setFilterFrom(''); setFilterTo(''); setTimeout(loadComplaints,100); }}>✕ {t('clear')}</button>
              </div>
              <div className="table-wrap">
                <div className="table-head"><h3>📋 {t('complaints')} ({complaints.length})</h3></div>
                <div style={{ overflowX:'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('citizen')}</th>
                        <th>{t('type')}</th>
                        <th>Location</th>
                        <th>{t('status')}</th>
                        <th>{t('date')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((c,i) => (
                        <tr key={c._id}>
                          <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{i+1}</td>
                          <td>
                            <div style={{ fontWeight:600 }}>{c.userName}</div>
                            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>📞 {c.userMobile}</div>
                          </td>
                          <td>{TYPE_ICONS[c.type]} {c.type}</td>
                          <td style={{ maxWidth:150, fontSize:'0.85rem' }}>{c.location}</td>
                          <td>
                            <span className="status-badge" style={{ background:STATUS_BG[c.status], color:STATUS_COLORS[c.status] }}>{c.status}</span>
                          </td>
                          <td style={{ fontSize:'0.82rem' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                          <td>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                              {c.status==='pending' && (
                                <>
                                  <button className="filter-btn" style={{ fontSize:'0.75rem', padding:'4px 10px' }} onClick={() => setAssignModal(c)}>👷 {t('assign')}</button>
                                  <button className="filter-btn" style={{ fontSize:'0.75rem', padding:'4px 10px', borderColor:'var(--danger)', color:'var(--danger)' }} onClick={() => { setRejectModal(c._id); setRejectReason(''); }}>❌ {t('reject')}</button>
                                </>
                              )}
                              {c.status==='assigned' && (
                                <button className="filter-btn" style={{ fontSize:'0.75rem', padding:'4px 10px', borderColor:'var(--success)', color:'var(--success)' }} onClick={() => updateStatus(c._id,'solved')}>✅ {t('markSolved')}</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {complaints.length===0 && !loading && <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No complaints found</div>}
                  {loading && <div className="spinner"><div className="spin"></div></div>}
                </div>
              </div>
            </>
          )}

          {/* ── SUPERVISORS ── */}
          {tab==='supervisors' && (
            <>
              <div className="dash-header"><h1>{t('supervisorMgmt')}</h1><p>{t('supervisorMgmtDesc')}</p></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1.8fr', gap:'1.5rem' }}>
                <div style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'var(--shadow)' }}>
                  <h3 style={{ color:'var(--primary)', marginBottom:'1rem', fontFamily:'Syne,sans-serif' }}>➕ {t('addSupervisor')}</h3>
                  <form onSubmit={addSupervisor}>
                    {[['name','Full Name','text'],['mobile','Mobile Number','text'],['password','Password','password'],['area',t('area'),'text']].map(([field,placeholder,type]) => (
                      <div key={field} className="form-group">
                        <label>{placeholder}</label>
                        <input type={type} placeholder={placeholder} value={supForm[field]} onChange={e => setSupForm(f => ({...f,[field]:e.target.value}))} required />
                      </div>
                    ))}
                    <button className="btn-submit" type="submit">{t('addSupervisor')}</button>
                  </form>
                </div>
                <div className="table-wrap">
                  <div className="table-head"><h3>👷 {t('supervisors')} ({supervisors.length})</h3></div>
                  <table>
                    <thead><tr><th>Name</th><th>Mobile</th><th>{t('area')}</th><th>{t('joined')}</th><th>Action</th></tr></thead>
                    <tbody>
                      {supervisors.map(s => (
                        <tr key={s._id}>
                          <td><strong>{s.name}</strong></td>
                          <td>📞 {s.mobile}</td>
                          <td>📍 {s.area||'—'}</td>
                          <td style={{ fontSize:'0.82rem' }}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                          <td>
                            <button onClick={() => deleteSupervisor(s._id)} style={{ background:'#fee2e2', color:'#dc2626', border:'none', padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
                              🗑️ {t('delete')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {supervisors.length===0 && <div style={{ textAlign:'center', padding:'1.5rem', color:'var(--text-muted)' }}>No supervisors added yet</div>}
                </div>
              </div>
            </>
          )}

          {/* ── USERS ── */}
          {tab==='users' && (
            <>
              <div className="dash-header"><h1>{t('registeredCitizens')}</h1><p>{t('allRegistered')}</p></div>
              <div className="table-wrap">
                <div className="table-head"><h3>👥 {t('users')} ({users.length})</h3></div>
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>Mobile</th><th>{t('joined')}</th></tr></thead>
                  <tbody>
                    {users.map((u,i) => (
                      <tr key={u._id}>
                        <td style={{ color:'var(--text-muted)' }}>{i+1}</td>
                        <td><strong>{u.name}</strong></td>
                        <td>📞 {u.mobile}</td>
                        <td style={{ fontSize:'0.82rem' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length===0 && <div style={{ textAlign:'center', padding:'1.5rem', color:'var(--text-muted)' }}>No users registered yet</div>}
              </div>
            </>
          )}

          {/* ── CONTACTS ── */}
          {tab==='contacts' && (
            <>
              <div className="dash-header"><h1>{t('contactMessages')}</h1><p>{t('allMessages')}</p></div>
              <div className="table-wrap">
                <div className="table-head"><h3>💬 {t('contacts')} ({contacts.length})</h3></div>
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>Mobile</th><th>{t('message')}</th><th>{t('date')}</th></tr></thead>
                  <tbody>
                    {contacts.map((c,i) => (
                      <tr key={c._id}>
                        <td style={{ color:'var(--text-muted)' }}>{i+1}</td>
                        <td><strong>{c.name}</strong></td>
                        <td>📞 {c.mobile}</td>
                        <td style={{ maxWidth:280, fontSize:'0.85rem' }}>{c.message}</td>
                        <td style={{ fontSize:'0.82rem' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contacts.length===0 && <div style={{ textAlign:'center', padding:'1.5rem', color:'var(--text-muted)' }}>No messages yet</div>}
              </div>
            </>
          )}

          {/* ── REPORTS ── */}
          {tab==='report' && (
            <>
              <div className="dash-header"><h1>{t('systemReports')}</h1><p>{t('reportDesc')}</p></div>

              {/* Period + Date filters */}
              <div className="filters" style={{ marginBottom:'1.2rem' }}>
                {PERIODS.map(p => (
                  <button key={p.key} className={`filter-btn ${period===p.key?'active':''}`} onClick={() => setPeriod(p.key)}>{pl(p)}</button>
                ))}
                {period==='custom' && (
                  <div className="date-filter">
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                    <span>—</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} />
                  </div>
                )}
                <button className="filter-btn active" onClick={fetchReport}>🔍 {t('generateReport')}</button>
              </div>

              {!report ? (
                <div style={{ background:'white', borderRadius:16, padding:'3rem', textAlign:'center', boxShadow:'var(--shadow)' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📈</div>
                  <h3 style={{ color:'var(--primary)', marginBottom:'1rem' }}>{lang==='hi'?'अवधि चुनें और रिपोर्ट बनाएं':'Select a period and generate report'}</h3>
                  <button className="btn-submit" style={{ width:'auto', padding:'10px 28px', margin:'0 auto' }} onClick={fetchReport}>🔍 {t('generateReport')}</button>
                </div>
              ) : (
                <>
                  {/* PDF Download */}
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
                    <button onClick={handlePDF} disabled={pdfLoading} style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', border:'none', padding:'10px 24px', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:8, opacity:pdfLoading?0.7:1 }}>
                      📄 {pdfLoading ? t('generatingPDF') : t('downloadPDF')}
                    </button>
                  </div>

                  {/* Summary stat cards */}
                  <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
                    {[
                      { icon:'📋', num:report.total,                    label:t('totalComplaints'), color:'var(--primary)' },
                      { icon:'✅', num:report.byStatus?.solved||0,       label:t('resolved'),        color:'var(--success)' },
                      { icon:'⏳', num:(report.byStatus?.pending||0)+(report.byStatus?.assigned||0)+(report.byStatus?.['in-progress']||0), label:t('pending'), color:'var(--warning)' },
                      { icon:'❌', num:report.byStatus?.rejected||0,     label:t('rejected'),        color:'var(--danger)'  },
                    ].map((s,i) => (
                      <div key={i} className="stat-card">
                        <div className="s-icon">{s.icon}</div>
                        <div className="s-num" style={{ color:s.color }}>{s.num}</div>
                        <div className="s-label">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Resolution rate banner */}
                  {report.total > 0 && (
                    <div style={{ background:'linear-gradient(135deg,#dcfce7,#bbf7d0)', border:'1px solid #16a34a', borderRadius:12, padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                      <div>
                        <div style={{ fontWeight:800, color:'#15803d', fontSize:'1.3rem', fontFamily:'Syne,sans-serif' }}>
                          {((report.byStatus?.solved||0)/report.total*100).toFixed(1)}% {lang==='hi'?'समाधान दर':'Resolution Rate'}
                        </div>
                        <div style={{ color:'#166534', fontSize:'0.85rem', marginTop:2 }}>
                          {report.byStatus?.solved||0} {lang==='hi'?'हल किए गए':'solved'} / {report.total} {lang==='hi'?'कुल शिकायतें':'total complaints'}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
                        {Object.entries(report.byStatus||{}).filter(([,v])=>v>0).map(([k,v]) => (
                          <div key={k} style={{ textAlign:'center' }}>
                            <div style={{ fontWeight:800, fontSize:'1.1rem', color:STATUS_COLORS[k] }}>{v}</div>
                            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{k}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Charts row */}
                  <div className="charts-row">
                    <div className="chart-card">
                      <h3>{t('complaintsByType') || 'Complaints by Category'}</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize:11 }} />
                          <YAxis tick={{ fontSize:11 }} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6,6,0,0]}>
                            {barData.map((d,i) => <Cell key={i} fill={d.fill||'#0f4c75'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-card">
                      <h3>{t('complaintsByStatus') || 'Status Distribution'}</h3>
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                              {pieData.map((entry,i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>{t('noDataPeriod')}</div>
                      )}
                    </div>
                  </div>

                  {/* Area-wise analysis */}
                  {report.byArea?.length > 0 && (
                    <>
                      {/* Area Table */}
                      <div className="chart-card" style={{ marginTop:'1.5rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                          <h3 style={{ margin:0 }}>📍 {t('areaWiseComplaints') || 'Area-wise Complaint Analysis'}</h3>
                          <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                            {lang==='hi'?`शीर्ष ${report.byArea.length} क्षेत्र`:`Top ${report.byArea.length} areas`}
                          </div>
                        </div>
                        <div style={{ overflowX:'auto' }}>
                          <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead>
                              <tr style={{ background:'var(--primary)', color:'white' }}>
                                {['#', t('areaName')||'Area', t('totalCount')||'Total', t('solvedCount')||'Solved', t('pendingCount')||'Pending', t('rejectedCount')||'Rejected', lang==='hi'?'समाधान दर':'Rate'].map((h,i) => (
                                  <th key={i} style={{ padding:'11px 14px', textAlign:i>1?'center':'left', fontWeight:700, fontSize:'0.82rem', whiteSpace:'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {report.byArea.map((row,i) => {
                                const rate = row.total > 0 ? ((row.solved/row.total)*100).toFixed(0) : 0;
                                return (
                                  <tr key={i} style={{ background:i%2===0?'white':'var(--bg)' }}>
                                    <td style={{ padding:'10px 14px', color:'var(--text-muted)', fontSize:'0.82rem' }}>{i+1}</td>
                                    <td style={{ padding:'10px 14px', fontWeight:600, fontSize:'0.88rem' }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                        <span>📍</span>
                                        <span>{row.area}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding:'10px 14px', textAlign:'center', fontWeight:700, color:'var(--primary)', fontSize:'1rem' }}>{row.total}</td>
                                    <td style={{ padding:'10px 14px', textAlign:'center' }}>
                                      <span style={{ background:'#dcfce7', color:'#15803d', borderRadius:50, padding:'3px 10px', fontSize:'0.82rem', fontWeight:700 }}>{row.solved||0}</span>
                                    </td>
                                    <td style={{ padding:'10px 14px', textAlign:'center' }}>
                                      <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:50, padding:'3px 10px', fontSize:'0.82rem', fontWeight:700 }}>{row.pending||0}</span>
                                    </td>
                                    <td style={{ padding:'10px 14px', textAlign:'center' }}>
                                      <span style={{ background:'#fee2e2', color:'#b91c1c', borderRadius:50, padding:'3px 10px', fontSize:'0.82rem', fontWeight:700 }}>{row.rejected||0}</span>
                                    </td>
                                    <td style={{ padding:'10px 14px', textAlign:'center' }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
                                        <div style={{ width:50, height:6, background:'#e2e8f0', borderRadius:3, overflow:'hidden' }}>
                                          <div style={{ width:`${rate}%`, height:'100%', background:'#16a34a', borderRadius:3 }}/>
                                        </div>
                                        <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#15803d' }}>{rate}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Area Horizontal Bar Chart */}
                      <div className="chart-card" style={{ marginTop:'1.5rem' }}>
                        <h3>🏆 {lang==='hi'?'शीर्ष क्षेत्र — शिकायत भार':'Top Areas — Complaint Load'}</h3>
                        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'1rem' }}>
                          {report.byArea.slice(0,8).map((row,i) => {
                            const maxTotal = report.byArea[0]?.total || 1;
                            const totalPct  = (row.total / maxTotal) * 100;
                            const solvedPct = row.total > 0 ? (row.solved / row.total) * 100 : 0;
                            return (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                <div style={{ width:160, fontSize:'0.82rem', fontWeight:600, color:'var(--text)', flexShrink:0, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {i+1}. {row.area}
                                </div>
                                <div style={{ flex:1, height:16, background:'#f1f5f9', borderRadius:8, overflow:'hidden', position:'relative' }}>
                                  <div style={{ width:`${totalPct}%`, height:'100%', background:'#e2e8f0', borderRadius:8, position:'absolute' }}/>
                                  <div style={{ width:`${(totalPct * solvedPct/100)}%`, height:'100%', background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:8, position:'absolute' }}/>
                                </div>
                                <div style={{ width:60, display:'flex', gap:8, flexShrink:0, fontSize:'0.8rem' }}>
                                  <span style={{ fontWeight:700, color:'var(--primary)' }}>{row.total}</span>
                                  <span style={{ color:'var(--success)', fontWeight:600 }}>✓{row.solved||0}</span>
                                </div>
                              </div>
                            );
                          })}
                          {/* Legend */}
                          <div style={{ display:'flex', gap:'1.5rem', marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color:'var(--text-muted)' }}>
                              <div style={{ width:14, height:8, background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:4 }}/>
                              {lang==='hi'?'हल की गई':'Solved'}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color:'var(--text-muted)' }}>
                              <div style={{ width:14, height:8, background:'#e2e8f0', borderRadius:4 }}/>
                              {lang==='hi'?'कुल शिकायतें':'Total complaints'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="reject-modal">
          <div className="reject-modal-box">
            <h3 style={{ color:'var(--danger)', marginBottom:'1rem' }}>❌ {t('rejectComplaint')}</h3>
            <div className="form-group">
              <label>{t('reasonForRejection')}</label>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t('reasonPlaceholder')} style={{ width:'100%', padding:'10px', border:'2px solid var(--border)', borderRadius:8, fontFamily:'DM Sans,sans-serif' }}/>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:10 }}>
              <button className="btn-submit" style={{ background:'var(--danger)' }} onClick={() => { updateStatus(rejectModal,'rejected',{ rejectionReason:rejectReason }); setRejectModal(null); }}>{t('confirmReject')}</button>
              <button className="btn-cancel" onClick={() => setRejectModal(null)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="reject-modal">
          <div className="reject-modal-box">
            <h3 style={{ color:'var(--primary)', marginBottom:'1rem' }}>👷 {t('assignToSupervisor')}</h3>
            <div className="form-group">
              <label>{t('selectSupervisor')}</label>
              <select value={selectedSup} onChange={e => setSelectedSup(e.target.value)} style={{ width:'100%', padding:'10px', border:'2px solid var(--border)', borderRadius:8, fontFamily:'DM Sans,sans-serif' }}>
                <option value="">{t('selectSupervisor')}</option>
                {supervisors.map(s => <option key={s._id} value={s._id}>{s.name} — {s.area} (📞 {s.mobile})</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:10 }}>
              <button className="btn-submit" onClick={() => {
                if (!selectedSup) { toast.error('Select a supervisor'); return; }
                updateStatus(assignModal._id,'assigned',{ supervisorId:selectedSup });
                setAssignModal(null); setSelectedSup('');
              }}>{t('assign')}</button>
              <button className="btn-cancel" onClick={() => setAssignModal(null)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
