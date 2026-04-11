import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { visitorsAPI, alertsAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const STATUS_COLOR = { approved:'green', pending:'amber', denied:'red', flagged:'red', exited:'gray' };
const METHOD_COLOR = { otp:'blue', qr:'green', manual:'gray' };
const HOURS = ['6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h'];
const GC = 'rgba(0,0,0,0.05)';
const TC = '#9ca3af';

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
  }, []);

  useEffect(() => { load(); }, [load]);

  useSocket((event) => {
    if (['approval_request','visitor_approved','visitor_denied','new_alert'].includes(event)) load();
  });

  const hourlyData = HOURS.map((_, i) => {
    const h = stats?.hourly?.find(x => x._id === 6 + i);
    return h?.count || 0;
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
      <div className="spinner"/>
    </div>
  );

  return (
    <div className="fade-in">

      {/* KPIs */}
      <div className="grid4" style={{ marginBottom: 20 }}>
        {[
          { label: t('admin.todaysVisitors', "Today's visitors"), value: stats?.total    || 0, color:'var(--pri)', sub: t('admin.allGateEntries', 'All gate entries') },
          { label: t('admin.approvedEntries', 'Approved entries'), value: stats?.approved || 0, color:'var(--grn)', sub:`${stats?.total ? Math.round(stats.approved/stats.total*100) : 0}% ` + t('admin.approvalRate', 'approval rate') },
          { label: t('admin.deniedFlagged', 'Denied / flagged'), value: stats?.denied   || 0, color:'var(--red)', sub: t('admin.includesFlagged', 'Includes flagged') },
          { label: t('admin.pendingApproval', 'Pending approval'), value: stats?.pending  || 0, color:'var(--amb)', sub: t('admin.awaitingResident', 'Awaiting resident') },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ height:3, background:s.color, borderRadius:2, marginBottom:12 }}/>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{ marginBottom: 20 }}>

        {/* Live entry feed */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>{t('admin.liveEntryFeed', 'Live entry feed')}</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--grn)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--grn)', display:'inline-block', animation:'pulse 1.4s infinite' }}/>
              {t('admin.live', 'Live')}
            </div>
          </div>
          {visitors.length === 0 ? (
            <div style={{ color:'var(--tx3)', fontSize:13, textAlign:'center', padding:'24px 0' }}>{t('admin.noVisitorsToday', 'No visitors today')}</div>
          ) : visitors.map(v => (
            <div key={v._id} className="vrow">
              <div className="av" style={{ background: v.isSuspicious ? 'var(--red-lt)' : 'var(--pri-lt)', color: v.isSuspicious ? 'var(--red)' : 'var(--pri)' }}>
                {v.name === 'Unknown' ? '??' : v.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="vn" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{v.name === 'Unknown' ? t('admin.unknown', 'Unknown') : v.name}</div>
                <div className="vm" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {v.flatNumber ? `${t('admin.flat', 'Flat')} ${v.flatNumber} · ` : ''}{t('admin.purpose.' + v.purpose, v.purpose)}
                </div>
              </div>
              <span className={`badge badge-${STATUS_COLOR[v.status]||'gray'}`}>{t(`admin.status.${v.status}`, v.status)}</span>
              <span className={`badge badge-${METHOD_COLOR[v.entryMethod]||'gray'}`}>{t(`admin.method.${v.entryMethod}`, v.entryMethod)}</span>
            </div>
          ))}
        </div>

        {/* Hourly bar chart */}
        <div className="card">
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14 }}>{t('admin.entryVolumeToday', 'Entry volume — today')}</div>
          <div style={{ position:'relative', height:200 }}>
            <Bar
              data={{ labels: HOURS, datasets:[{ data: hourlyData, backgroundColor:'rgba(37,99,235,.65)', borderColor:'#2563eb', borderWidth:1, borderRadius:4 }]}}
              options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
                scales:{ x:{ grid:{ color:GC }, ticks:{ color:TC, font:{ size:10 } } },
                         y:{ grid:{ color:GC }, ticks:{ color:TC, font:{ size:10 } } } } }}
            />
          </div>
        </div>
      </div>

      <div className="grid2">

        {/* Visitor type bars */}
        <div className="card">
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14 }}>{t('admin.visitorTypeBreakdown', 'Visitor type breakdown')}</div>
          {(stats?.byPurpose || []).length === 0 ? (
            <div style={{ color:'var(--tx3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>{t('admin.noDataYet', 'No data yet')}</div>
          ) : (stats?.byPurpose || []).map(p => {
            const purposeColors = { guest: 'var(--pri)', delivery: '#7c3aed', maintenance: 'var(--amb)', cab: 'var(--grn)', other: 'var(--red)' };
            const tot = stats.byPurpose.reduce((sum, item) => sum + item.count, 0);
            const pct = tot ? Math.round((p.count / tot) * 100) : 0;
            return (
              <div key={p._id} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--tx2)', marginBottom:4, textTransform:'capitalize' }}>
                  <span>{t(`admin.${p._id}`, p._id)}</span><span style={{ fontFamily:'var(--mono)' }}>{pct}%</span>
                </div>
                <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:purposeColors[p._id] || 'var(--tx3)', borderRadius:3 }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent alerts */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>{t('admin.securityAlerts', 'Security alerts')}</div>
            <a href="/admin/alerts" style={{ fontSize:11, color:'var(--pri)' }}>{t('admin.viewAll', 'View all')}</a>
          </div>
          {alerts.length === 0 ? (
            <div style={{ color:'var(--tx3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>{t('admin.noActiveAlerts', 'No active alerts')}</div>
          ) : alerts.slice(0,3).map(a => (
            <div key={a._id} className={`alert-strip ${a.severity==='medium'?'warn':''}`} style={{ marginBottom:8 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke={a.severity==='high'?'var(--red)':'var(--amb)'} strokeWidth="1.4" strokeLinecap="round">
                <path d="M7 1L13 12H1L7 1zM7 5v3m0 2v.5"/>
              </svg>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--tx)' }}>{a.title}</div>
                <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2, fontFamily:'var(--mono)' }}>
                  {new Date(a.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
