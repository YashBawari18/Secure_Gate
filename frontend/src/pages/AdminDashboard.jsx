import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { visitorsAPI, alertsAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const STATUS_COLOR = { approved:'var(--grn)', pending:'var(--amb)', denied:'var(--red)', flagged:'var(--red)', exited:'var(--tx3)' };
const HOURS = ['6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h'];

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { t } = useTranslation();

  const load = useCallback(async () => {
    try {
      const [s, v, a] = await Promise.all([
        visitorsAPI.getStats(),
        visitorsAPI.getAll({ limit: 7 }),
        alertsAPI.getAll({ status: 'active' }),
      ]);
      setStats(s.data.stats);
      setVisitors(v.data.visitors);
      setAlerts(a.data.alerts);
    } catch { toast.error(t('admin.failedLoad', 'Failed to load dashboard')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  useSocket((event) => {
    if (['approval_request','visitor_approved','visitor_denied','new_alert'].includes(event)) load();
  });

  const hourlyData = HOURS.map((_, i) => {
    const h = stats?.hourly?.find(x => x._id === 6 + i);
    return h?.count || 0;
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--pri) transparent var(--pri) transparent' }}/>
    </div>
  );

  return (
    <div className="crazy-bento-wrapper fade-in" style={{ padding: '0 0 40px 0' }}>
      
      {/* Top Welcome Section */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #1e3a8a, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Platform Overview
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: 16, fontWeight: 500 }}>Live monitoring & analytics</p>
      </div>

      {/* KPI BENTO GRID */}
      <div className="bento-kpi-grid">
        <div className="bento-kpi" style={{ '--hover-color': '#4f46e5' }}>
          <div className="bento-lbl" style={{ color: '#4f46e5' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {t('admin.todaysVisitors', "Total Entries")}
          </div>
          <div className="bento-num" style={{ color: '#1e3a8a' }}>{stats?.total || 0}</div>
        </div>

        <div className="bento-kpi" style={{ '--hover-color': '#10b981' }}>
          <div className="bento-lbl" style={{ color: '#10b981' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {t('admin.approvedEntries', 'Approved')}
          </div>
          <div className="bento-num" style={{ color: '#064e3b' }}>{stats?.approved || 0}</div>
        </div>

        <div className="bento-kpi" style={{ '--hover-color': '#ef4444' }}>
          <div className="bento-lbl" style={{ color: '#ef4444' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {t('admin.deniedFlagged', 'Denied')}
          </div>
          <div className="bento-num" style={{ color: '#7f1d1d' }}>{stats?.denied || 0}</div>
        </div>

        <div className="bento-kpi" style={{ '--hover-color': '#f59e0b' }}>
          <div className="bento-lbl" style={{ color: '#f59e0b' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {t('admin.pendingApproval', 'Pending')}
          </div>
          <div className="bento-num" style={{ color: '#78350f' }}>{stats?.pending || 0}</div>
        </div>
      </div>

      {/* COMPLEX BENTO ROWS */}
      <div className="bento-row">
        
        {/* Giant Graph */}
        <div className="bento-card">
          <div className="bento-card-title">
            <span>{t('admin.entryVolumeToday', 'Traffic Volume (Today)')}</span>
            <div style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>Hourly</div>
          </div>
          <div style={{ position:'relative', height: 260 }}>
            <Bar
              data={{ 
                labels: HOURS, 
                datasets:[{ 
                  data: hourlyData, 
                  backgroundColor:(ctx) => {
                    const canvas = ctx.chart.ctx;
                    const grad = canvas.createLinearGradient(0, 0, 0, 260);
                    grad.addColorStop(0, 'rgba(79, 70, 229, 0.9)');
                    grad.addColorStop(1, 'rgba(79, 70, 229, 0.1)');
                    return grad;
                  },
                  borderRadius: 12, borderSkipped: false, barPercentage: 0.6
                }]
              }}
              options={{ 
                responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip: { backgroundColor: '#1e293b', padding: 12, titleFont: { size: 14 }, bodyFont: { size: 14 }, displayColors: false } },
                scales:{ x:{ grid:{ display: false }, border: { display: false }, ticks:{ color: '#64748b', font:{ size:12, weight: 600 } } },
                         y:{ grid:{ display: false }, border: { display: false }, ticks:{ display: false } } } 
              }}
            />
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-card-title">{t('admin.visitorTypeBreakdown', 'Visitor Types')}</div>
          {(stats?.byPurpose || []).length === 0 ? (
            <div style={{ color:'var(--tx3)', fontSize:14, margin:'auto' }}>{t('admin.noDataYet', 'No data yet')}</div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
              {(stats?.byPurpose || []).map(p => {
                const purposeColors = { guest: '#4f46e5', delivery: '#ec4899', maintenance: '#f59e0b', cab: '#10b981', other: '#64748b' };
                const tot = stats.byPurpose.reduce((sum, item) => sum + item.count, 0);
                const pct = tot ? Math.round((p.count / tot) * 100) : 0;
                return (
                  <div key={p._id}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight: 700, color:'var(--tx2)', marginBottom:8, textTransform:'capitalize' }}>
                      <span>{t(`admin.${p._id}`, p._id)}</span>
                      <span style={{ color: purposeColors[p._id] || '#64748b' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 10, background:'rgba(0,0,0,0.04)', borderRadius: 5, overflow:'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:purposeColors[p._id] || '#64748b', borderRadius: 5, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bento-row-inv">
        
        {/* Security Alerts Stream */}
        <div className="bento-card" style={{ padding: 24 }}>
          <div className="bento-card-title" style={{ padding: '0 8px', marginBottom: 16 }}>
            <span>{t('admin.securityAlerts', 'Active Alerts')}</span>
            <span style={{ display: 'flex', width: 12, height: 12, background: 'var(--red)', borderRadius: '50%', boxShadow: '0 0 12px var(--red)' }}></span>
          </div>
          {alerts.length === 0 ? (
            <div style={{ color:'var(--tx3)', fontSize:14, textAlign:'center', margin: '40px 0' }}>{t('admin.noActiveAlerts', 'No active alerts')}</div>
          ) : alerts.slice(0,4).map(a => (
            <a href="/admin/alerts" key={a._id} style={{ display: 'block' }}>
              <div className="bento-feed-item" style={{ background: a.severity==='high' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: a.severity==='high' ? 'var(--red)' : 'var(--amb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{new Date(a.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>
            </a>
          ))}
          {alerts.length > 0 && <a href="/admin/alerts" style={{ display: 'block', textAlign: 'center', padding: '12px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--pri)' }}>View Alert Center &rarr;</a>}
        </div>

        {/* Live Entries */}
        <div className="bento-card">
          <div className="bento-card-title">
            <span>{t('admin.liveEntryFeed', 'Live Feed')}</span>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--grn)', background: 'var(--grn-lt)', padding: '4px 12px', borderRadius: 20 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--grn)', animation:'pulse 1.4s infinite' }}/>
              {t('admin.live', 'Live')}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {visitors.length === 0 ? (
              <div style={{ color:'var(--tx3)', fontSize:14, textAlign:'center', gridColumn: '1 / -1', padding: '40px 0' }}>{t('admin.noVisitorsToday', 'No visitors today')}</div>
            ) : visitors.map(v => (
              <div key={v._id} className="bento-feed-item">
                <div style={{ width: 48, height: 48, borderRadius: 16, background: v.isSuspicious?'#fef2f2':'#eff6ff', color: v.isSuspicious?'#ef4444':'#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0, border: `1px solid ${v.isSuspicious?'rgba(239,68,68,0.2)':'transparent'}` }}>
                  {v.name === 'Unknown' ? '?' : v.name.substring(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.name === 'Unknown' ? t('admin.unknown', 'Unknown') : v.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {v.flatNumber && <span style={{ background: 'var(--bg4)', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: 'var(--tx2)' }}>Apt {v.flatNumber}</span>}
                    {t('admin.purpose.' + v.purpose, v.purpose)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: STATUS_COLOR[v.status] + '20', color: STATUS_COLOR[v.status], textTransform: 'uppercase' }}>
                    {t(`admin.status.${v.status}`, v.status)}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx3)' }}>
                    {new Date(v.entryTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
