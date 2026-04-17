import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import API from '../utils/api';
import { generatePDF } from '../utils/pdfReport';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STATUS_META = {
  pending:       { color: '#f59e0b', bg: '#fef3c7' },
  assigned:      { color: '#3b82f6', bg: '#dbeafe' },
  'in-progress': { color: '#0891b2', bg: '#e0f2fe' },
  solved:        { color: '#16a34a', bg: '#dcfce7' },
  rejected:      { color: '#dc2626', bg: '#fee2e2' },
};
const TYPE_META = {
  garbage:     { label: 'Garbage',      labelHi: 'कचरा',        icon: '🗑️', color: '#f59e0b' },
  streetlight: { label: 'Street Light', labelHi: 'स्ट्रीट लाइट', icon: '💡', color: '#eab308' },
  water:       { label: 'Water',        labelHi: 'पानी',         icon: '💧', color: '#3b82f6' },
  drainage:    { label: 'Drainage',     labelHi: 'नाली',         icon: '🚿', color: '#a855f7' },
};
const PERIODS = [
  { key: 'all',       en: 'All Time',     hi: 'सभी समय' },
  { key: 'today',     en: 'Today',        hi: 'आज' },
  { key: 'yesterday', en: 'Yesterday',    hi: 'कल' },
  { key: 'last10',    en: 'Last 10 Days', hi: 'पिछले 10 दिन' },
  { key: 'month',     en: 'Last Month',   hi: 'पिछला महीना' },
  { key: 'custom',    en: 'Custom',       hi: 'कस्टम' },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('complaints');
  const [period, setPeriod] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    API.get('/complaints/my').then(r => { setComplaints(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fetchReport = async () => {
    try {
      let url = '/complaints/my-report?';
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
    try { generatePDF({ role: 'user', reportData: report, user, period, from, to, lang }); toast.success(t('reportGenerated')); }
    catch { toast.error('PDF failed'); }
    setPdfLoading(false);
  };

  const filterComplaints = () => {
    const now = new Date();
    return complaints.filter(c => {
      const d = new Date(c.createdAt);
      if (period === 'today') return d.toDateString() === now.toDateString();
      if (period === 'yesterday') { const y = new Date(now); y.setDate(y.getDate()-1); return d.toDateString() === y.toDateString(); }
      if (period === 'last10') return (now-d)/86400000 <= 10;
      if (period === 'month') return (now-d)/86400000 <= 30;
      if (period === 'custom' && from && to) return d >= new Date(from) && d <= new Date(to);
      return true;
    });
  };
  const filtered = filterComplaints();
  const pl = item => lang === 'hi' ? item.hi : item.en;

  if (loading) return <div className="spinner"><div className="spin"></div></div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <div className="dash-header">
        <h1>👤 {t('myDashboard')}</h1>
        <p>{t('welcomeBack2')}, <strong>{user?.name}</strong>! {t('trackDesc')}</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:'1.5rem', background:'white', borderRadius:12, padding:6, width:'fit-content', boxShadow:'var(--shadow)' }}>
        {[['complaints',`📋 ${t('myComplaintsTab')}`],['report',`📊 ${t('reportTab')}`]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ padding:'9px 20px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.9rem', fontFamily:'DM Sans,sans-serif', background:tab===key?'var(--primary)':'none', color:tab===key?'white':'var(--text-muted)' }}>{label}</button>
        ))}
      </div>

      {/* Period Filters */}
      <div className="filters" style={{ marginBottom:'1.2rem' }}>
        {PERIODS.map(p=>(
          <button key={p.key} className={`filter-btn ${period===p.key?'active':''}`} onClick={()=>setPeriod(p.key)}>{pl(p)}</button>
        ))}
        {period==='custom' && (
          <div className="date-filter">
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
            <span>—</span>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} />
          </div>
        )}
        {tab==='report' && (
          <button className="filter-btn active" onClick={fetchReport}>🔍 {lang==='hi'?'बनाएं':'Apply'}</button>
        )}
      </div>

      {/* COMPLAINTS TAB */}
      {tab==='complaints' && (
        <div>
          {filtered.length===0 ? (
            <div style={{ background:'white', borderRadius:16, padding:'3rem', textAlign:'center', boxShadow:'var(--shadow)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📭</div>
              <h3 style={{ color:'var(--primary)', marginBottom:'0.5rem' }}>{t('noComplaints')}</h3>
              <p style={{ color:'var(--text-muted)' }}>{t('noComplaintsDesc')}</p>
            </div>
          ) : filtered.map(c => {
            const sm = STATUS_META[c.status]||STATUS_META.pending;
            const tm = TYPE_META[c.type]||{};
            const statusLabels = { pending:t('statusPending'), assigned:t('statusAssigned'), 'in-progress':t('statusInProgress'), solved:t('statusSolved'), rejected:t('statusRejected') };
            return (
              <div key={c._id} className="complaint-item" style={{ borderLeftColor:sm.color }}>
                <div className="complaint-item-header">
                  <div>
                    <span style={{ fontSize:'1.3rem' }}>{tm.icon}</span>
                    <strong style={{ marginLeft:8, color:'var(--primary)' }}>{lang==='hi'?tm.labelHi:tm.label}</strong>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:2 }}>
                      📍 {c.location} • {new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  </div>
                  <span className={`status-badge status-${c.status}`} style={{ background:sm.bg, color:sm.color }}>{statusLabels[c.status]||c.status}</span>
                </div>
                <p style={{ fontSize:'0.9rem', color:'var(--text-muted)', lineHeight:1.6, marginBottom:8 }}>{c.description}</p>
                {c.supervisorId && (
                  <div className="supervisor-info">
                    <strong>👷 {t('assignedTo')}:</strong> {c.supervisorName} | 📞 {c.supervisorMobile}
                  </div>
                )}
                {c.status==='rejected'&&c.rejectionReason && (
                  <div style={{ background:'#fee2e2', borderRadius:8, padding:'8px 12px', marginTop:8, fontSize:'0.85rem', color:'#b91c1c' }}>❌ {t('rejectionReason')}: {c.rejectionReason}</div>
                )}
                {c.status==='solved' && (
                  <div style={{ background:'#dcfce7', borderRadius:8, padding:'8px 12px', marginTop:8, fontSize:'0.85rem', color:'#15803d' }}>
                    ✅ {t('resolvedOn')} {c.resolvedAt?new Date(c.resolvedAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'N/A'}
                  </div>
                )}
                {c.media?.length>0 && (
                  <div className="media-grid">
                    {c.media.map((m,i)=>m.match(/\.(mp4|mov|avi|webm)$/i)?
                      <div key={i} style={{ width:70,height:70,background:'#e2e8f0',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem' }}>🎥</div>:
                      <img key={i} src={`/uploads/${m}`} alt="" className="media-thumb"/>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* REPORT TAB */}
      {tab==='report' && (
        <div>
          {!report ? (
            <div style={{ background:'white', borderRadius:16, padding:'3rem', textAlign:'center', boxShadow:'var(--shadow)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📊</div>
              <h3 style={{ color:'var(--primary)', marginBottom:'1rem' }}>{lang==='hi'?'फ़िल्टर चुनें और बनाएं':'Select a period and generate'}</h3>
              <button className="btn-submit" style={{ width:'auto',padding:'10px 28px',margin:'0 auto' }} onClick={fetchReport}>🔍 {lang==='hi'?'रिपोर्ट बनाएं':'Generate Report'}</button>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
                <button onClick={handlePDF} disabled={pdfLoading} style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', border:'none', padding:'10px 22px', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:8, opacity:pdfLoading?0.7:1 }}>
                  📄 {pdfLoading?t('generatingPDF'):t('downloadPDF')}
                </button>
              </div>
              <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
                {[
                  { icon:'📋', num:report.total, label:t('totalComplaints'), color:'var(--primary)' },
                  { icon:'✅', num:report.byStatus?.solved||0, label:t('resolved'), color:'var(--success)' },
                  { icon:'⏳', num:(report.byStatus?.pending||0)+(report.byStatus?.assigned||0)+(report.byStatus?.['in-progress']||0), label:t('pending'), color:'var(--warning)' },
                  { icon:'❌', num:report.byStatus?.rejected||0, label:t('rejected'), color:'var(--danger)' },
                ].map((s,i)=>(
                  <div key={i} className="stat-card">
                    <div className="s-icon">{s.icon}</div>
                    <div className="s-num" style={{ color:s.color }}>{s.num}</div>
                    <div className="s-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="charts-row">
                <div className="chart-card">
                  <h3>{t('complaintsByType')}</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={Object.entries(report.byType||{}).map(([k,v])=>({ name:lang==='hi'?(TYPE_META[k]?.labelHi||k):(TYPE_META[k]?.label||k), count:v }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="name" tick={{ fontSize:11 }}/>
                      <YAxis tick={{ fontSize:11 }}/>
                      <Tooltip/>
                      <Bar dataKey="count" radius={[6,6,0,0]}>
                        {Object.entries(report.byType||{}).map(([k],i)=><Cell key={i} fill={TYPE_META[k]?.color||'#0f4c75'}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card">
                  <h3>{t('complaintsByStatus')}</h3>
                  {Object.values(report.byStatus||{}).some(v=>v>0)?(
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={Object.entries(report.byStatus||{}).filter(([,v])=>v>0).map(([k,v])=>({ name:k, value:v, color:STATUS_META[k]?.color||'#64748b' }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                          {Object.entries(report.byStatus||{}).filter(([,v])=>v>0).map(([k],i)=><Cell key={i} fill={STATUS_META[k]?.color||'#64748b'}/>)}
                        </Pie>
                        <Tooltip/>
                      </PieChart>
                    </ResponsiveContainer>
                  ):<div style={{ textAlign:'center',padding:'3rem',color:'var(--text-muted)' }}>{t('noDataPeriod')}</div>}
                </div>
              </div>
              {report.byArea?.length>0 && (
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
                            <td style={{ padding:'9px 14px', fontWeight:600, fontSize:'0.88rem' }}>📍 {row.area}</td>
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
        </div>
      )}
    </div>
  );
}
