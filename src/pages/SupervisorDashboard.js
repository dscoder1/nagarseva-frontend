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
const PERIODS = [
  { key:'all',       en:'All Time',     hi:'सभी समय' },
  { key:'today',     en:'Today',        hi:'आज' },
  { key:'yesterday', en:'Yesterday',    hi:'कल' },
  { key:'last10',    en:'Last 10 Days', hi:'पिछले 10 दिन' },
  { key:'month',     en:'Last Month',   hi:'पिछला महीना' },
  { key:'custom',    en:'Custom',       hi:'कस्टम' },
];

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const { lang, t } = useLang();
  const [tab, setTab] = useState('complaints');
  const [complaints, setComplaints] = useState([]);
  const [report, setReport] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [period, setPeriod] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { loadComplaints(); }, []);

  const loadComplaints = async () => { try { const r = await API.get('/supervisor/complaints'); setComplaints(r.data); } catch {} };

  const fetchReport = async () => {
    try {
      let url = '/supervisor/report?';
      if (period !== 'all' && period !== 'custom') url += `period=${period}&`;
      if (period === 'custom' && from) url += `from=${from}&`;
      if (period === 'custom' && to) url += `to=${to}&`;
      const r = await API.get(url);
      setReport(r.data);
    } catch {}
  };

  const handlePDF = async () => {
    if (!report) { toast.error('Generate report first'); return; }
    setPdfLoading(true);
    try { generatePDF({ role: 'supervisor', reportData: report, user, period, from, to, lang }); toast.success(t('reportGenerated')); }
    catch { toast.error('PDF failed'); }
    setPdfLoading(false);
  };

  const updateStatus = async (id, status, extra = {}) => {
    try { await API.put(`/supervisor/complaints/${id}`, { status, ...extra }); toast.success(`Marked as ${status}`); loadComplaints(); }
    catch { toast.error('Failed'); }
  };

  const stats = { total:complaints.length, solved:complaints.filter(c=>c.status==='solved').length, pending:complaints.filter(c=>['assigned','pending'].includes(c.status)).length, rejected:complaints.filter(c=>c.status==='rejected').length };
  const pl = item => lang==='hi' ? item.hi : item.en;

  return (
    <div className="dashboard">
      <div className="dash-layout">
        <aside className="dash-sidebar">
          <div className="dash-sidebar-brand">👷 {t('supervisorPanel')}</div>
          {[['complaints','📋',t('assignedComplaints')],['report','📊',t('reportTab')]].map(([key,icon,label])=>(
            <button key={key} className={`dash-nav-btn ${tab===key?'active':''}`} onClick={()=>{ setTab(key); if(key==='report') fetchReport(); }}>
              <span>{icon}</span> {label}
            </button>
          ))}
          <div style={{ flex:1 }}/>
          <div style={{ padding:'1rem', borderTop:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.7)', fontSize:'0.85rem' }}>
            <div style={{ fontWeight:700, color:'white', marginBottom:4 }}>{user?.name}</div>
            <div>📞 {user?.mobile}</div>
            {user?.area && <div>📍 {user.area}</div>}
          </div>
          <button className="dash-nav-btn logout" onClick={logout}><span>🚪</span> {t('logout')}</button>
        </aside>

        <div className="dash-content">
          {tab==='complaints' && (
            <>
              <div className="dash-header"><h1>{t('assignedComplaints')}</h1><p>{t('assignedDesc')}{user?.area?` — Area: ${user.area}`:''}</p></div>
              <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
                {[
                  { icon:'📋', num:stats.total, label:t('totalComplaints'), color:'var(--primary)' },
                  { icon:'✅', num:stats.solved, label:t('resolved'), color:'var(--success)' },
                  { icon:'⏳', num:stats.pending, label:t('pending'), color:'var(--warning)' },
                  { icon:'❌', num:stats.rejected, label:t('rejected'), color:'var(--danger)' },
                ].map((s,i)=>(
                  <div key={i} className="stat-card">
                    <div className="s-icon">{s.icon}</div>
                    <div className="s-num" style={{ color:s.color }}>{s.num}</div>
                    <div className="s-label">{s.label}</div>
                  </div>
                ))}
              </div>
              {complaints.length===0?(
                <div style={{ background:'white', borderRadius:16, padding:'3rem', textAlign:'center', boxShadow:'var(--shadow)' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📭</div>
                  <h3 style={{ color:'var(--primary)' }}>{t('noAssigned')}</h3>
                  <p style={{ color:'var(--text-muted)', marginTop:8 }}>{t('noAssignedDesc')}</p>
                </div>
              ):complaints.map(c=>(
                <div key={c._id} className="complaint-item" style={{ borderLeftColor:STATUS_COLORS[c.status]||'var(--primary)' }}>
                  <div className="complaint-item-header">
                    <div>
                      <span style={{ fontSize:'1.2rem' }}>{TYPE_ICONS[c.type]}</span>
                      <strong style={{ marginLeft:8, color:'var(--primary)' }}>{c.type?.toUpperCase()}</strong>
                      <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:4 }}>
                        👤 {c.userName} • 📞 {c.userMobile} • 📍 {c.location}
                      </div>
                      <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:2 }}>
                        📅 {new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                      </div>
                    </div>
                    <span className="status-badge" style={{ background:STATUS_BG[c.status], color:STATUS_COLORS[c.status] }}>{c.status}</span>
                  </div>
                  <p style={{ fontSize:'0.9rem', color:'var(--text-muted)', lineHeight:1.6, marginBottom:'0.75rem' }}>{c.description}</p>
                  {!['solved','rejected'].includes(c.status)&&(
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
                      <button className="filter-btn" style={{ borderColor:'var(--success)', color:'var(--success)', fontSize:'0.85rem' }} onClick={()=>updateStatus(c._id,'solved')}>✅ {t('markSolved')}</button>
                      <button className="filter-btn" style={{ borderColor:'var(--danger)', color:'var(--danger)', fontSize:'0.85rem' }} onClick={()=>{ setRejectModal(c._id); setRejectReason(''); }}>❌ {t('reject')}</button>
                      <button className="filter-btn" style={{ borderColor:'var(--info)', color:'var(--info)', fontSize:'0.85rem' }} onClick={()=>updateStatus(c._id,'in-progress')}>🔄 {t('markInProgress')}</button>
                    </div>
                  )}
                  {c.status==='solved'&&<div style={{ background:'#dcfce7', borderRadius:8, padding:'8px 12px', marginTop:8, fontSize:'0.85rem', color:'#15803d' }}>✅ {t('resolvedOn')} {c.resolvedAt?new Date(c.resolvedAt).toLocaleDateString('en-IN'):'N/A'}</div>}
                  {c.status==='rejected'&&c.rejectionReason&&<div style={{ background:'#fee2e2', borderRadius:8, padding:'8px 12px', marginTop:8, fontSize:'0.85rem', color:'#b91c1c' }}>❌ {c.rejectionReason}</div>}
                </div>
              ))}
            </>
          )}

          {tab==='report' && (
            <>
              <div className="dash-header"><h1>{t('myPerformance')}</h1><p>{t('myPerfDesc')}</p></div>
              <div className="filters" style={{ marginBottom:'1.2rem' }}>
                {PERIODS.map(p=>(
                  <button key={p.key} className={`filter-btn ${period===p.key?'active':''}`} onClick={()=>setPeriod(p.key)}>{pl(p)}</button>
                ))}
                {period==='custom'&&(
                  <div className="date-filter">
                    <input type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
                    <span>—</span>
                    <input type="date" value={to} onChange={e=>setTo(e.target.value)}/>
                  </div>
                )}
                <button className="filter-btn active" onClick={fetchReport}>🔍 {t('generate')}</button>
              </div>
              {!report?(
                <div style={{ background:'white', borderRadius:16, padding:'3rem', textAlign:'center', boxShadow:'var(--shadow)' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📊</div>
                  <h3 style={{ color:'var(--primary)', marginBottom:'1rem' }}>{lang==='hi'?'फ़िल्टर चुनें और बनाएं':'Select period and generate'}</h3>
                  <button className="btn-submit" style={{ width:'auto',padding:'10px 28px',margin:'0 auto' }} onClick={fetchReport}>🔍 {t('generate')}</button>
                </div>
              ):(
                <>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
                    <button onClick={handlePDF} disabled={pdfLoading} style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', border:'none', padding:'10px 22px', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:8, opacity:pdfLoading?0.7:1 }}>
                      📄 {pdfLoading?t('generatingPDF'):t('downloadPDF')}
                    </button>
                  </div>
                  <div className="stats-grid">
                    {[
                      { icon:'📋', num:report.total, label:t('totalComplaints'), color:'var(--primary)' },
                      { icon:'✅', num:report.byStatus?.solved||0, label:t('resolved'), color:'var(--success)' },
                      { icon:'❌', num:report.byStatus?.rejected||0, label:t('rejected'), color:'var(--danger)' },
                      { icon:'⏳', num:(report.byStatus?.assigned||0)+(report.byStatus?.pending||0), label:t('pending'), color:'var(--warning)' },
                    ].map((s,i)=>(
                      <div key={i} className="stat-card">
                        <div className="s-icon">{s.icon}</div>
                        <div className="s-num" style={{ color:s.color }}>{s.num}</div>
                        <div className="s-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="charts-row" style={{ marginTop:'1.5rem' }}>
                    <div className="chart-card">
                      <h3>{t('complaintsByType')}</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={Object.entries(report.byType||{}).map(([k,v])=>({ name:k, count:v }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                          <XAxis dataKey="name" tick={{ fontSize:11 }}/>
                          <YAxis tick={{ fontSize:11 }}/>
                          <Tooltip/>
                          <Bar dataKey="count" radius={[6,6,0,0]}>
                            {Object.entries(report.byType||{}).map(([k],i)=><Cell key={i} fill={TYPE_COLORS[k]||'#0f4c75'}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-card">
                      <h3>{t('statusBreakdown')}</h3>
                      {Object.values(report.byStatus||{}).some(v=>v>0)?(
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={Object.entries(report.byStatus||{}).filter(([,v])=>v>0).map(([k,v])=>({ name:k, value:v, color:STATUS_COLORS[k]||'#64748b' }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                              {Object.entries(report.byStatus||{}).filter(([,v])=>v>0).map(([k],i)=><Cell key={i} fill={STATUS_COLORS[k]||'#64748b'}/>)}
                            </Pie>
                            <Tooltip/>
                          </PieChart>
                        </ResponsiveContainer>
                      ):<div style={{ textAlign:'center',padding:'3rem',color:'var(--text-muted)' }}>{t('noDataPeriod')}</div>}
                    </div>
                  </div>
                  {report.byArea?.length>0&&(
                    <div className="chart-card" style={{ marginTop:'1.5rem' }}>
                      <h3>📍 {t('areaWiseComplaints')}</h3>
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', marginTop:8 }}>
                          <thead>
                            <tr style={{ background:'var(--primary)', color:'white' }}>
                              {['#',t('areaName'),t('totalCount'),t('solvedCount'),t('pendingCount'),t('rejectedCount')].map((h,i)=>(
                                <th key={i} style={{ padding:'10px 14px', textAlign:i>1?'center':'left', fontWeight:700, fontSize:'0.82rem' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {report.byArea.map((row,i)=>(
                              <tr key={i} style={{ background:i%2===0?'white':'var(--bg)' }}>
                                <td style={{ padding:'9px 14px', color:'var(--text-muted)', fontSize:'0.82rem' }}>{i+1}</td>
                                <td style={{ padding:'9px 14px', fontWeight:600 }}>📍 {row.area}</td>
                                <td style={{ padding:'9px 14px', textAlign:'center', fontWeight:700, color:'var(--primary)' }}>{row.total}</td>
                                <td style={{ padding:'9px 14px', textAlign:'center', fontWeight:600, color:'var(--success)' }}>{row.solved||0}</td>
                                <td style={{ padding:'9px 14px', textAlign:'center', fontWeight:600, color:'var(--warning)' }}>{row.pending||0}</td>
                                <td style={{ padding:'9px 14px', textAlign:'center', fontWeight:600, color:'var(--danger)' }}>{row.rejected||0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      {rejectModal&&(
        <div className="reject-modal">
          <div className="reject-modal-box">
            <h3 style={{ color:'var(--danger)', marginBottom:'1rem' }}>❌ {t('rejectComplaint')}</h3>
            <div className="form-group">
              <label>{t('reasonForRejection')}</label>
              <textarea rows={3} value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder={t('reasonPlaceholder')} style={{ width:'100%', padding:'10px', border:'2px solid var(--border)', borderRadius:8, fontFamily:'DM Sans,sans-serif' }}/>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-submit" style={{ background:'var(--danger)' }} onClick={()=>{ updateStatus(rejectModal,'rejected',{ rejectionReason:rejectReason }); setRejectModal(null); }}>{t('confirmReject')}</button>
              <button className="btn-cancel" onClick={()=>setRejectModal(null)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
