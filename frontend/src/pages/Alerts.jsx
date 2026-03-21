import React, { useEffect, useState } from 'react';
import { alertsAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

const SEV_BORDER = { high:'var(--red)', medium:'var(--amb)', low:'var(--pri)' };
const SEV_COLOR  = { high:'red',        medium:'amber',      low:'blue'       };

export default function Alerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await alertsAPI.getAll({ status:'active' });
      setAlerts(r.data.alerts);
    } catch { toast.error('Failed to load alerts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useSocket((event) => {
    if (event === 'new_alert') { load(); toast('New security alert!'); }
  });

  const dismiss  = async (id) => { try { await alertsAPI.dismiss(id);  toast.success('Alert dismissed');  load(); } catch { toast.error('Failed'); } };
  const escalate = async (id) => { try { await alertsAPI.escalate(id); toast.success('Alert escalated'); load(); } catch { toast.error('Failed'); } };

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:13, color:'var(--tx2)' }}>
          {loading ? '—' : alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48 }}><div className="spinner" style={{ margin:'0 auto' }}/></div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'48px 20px', color:'var(--tx3)' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--bdr2)" strokeWidth="2" style={{ marginBottom:14 }}>
            <path d="M24 5L44 40H4L24 5z"/><line x1="24" y1="18" x2="24" y2="30"/><circle cx="24" cy="35" r="2" fill="var(--bdr2)"/>
          </svg>
          <div style={{ fontWeight:500, fontSize:15, color:'var(--tx2)' }}>No active alerts</div>
          <div style={{ fontSize:12, marginTop:6 }}>All clear — the system is actively monitoring</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {alerts.map(a => (
            <div key={a._id} style={{ display:'flex', gap:14, padding:16, borderRadius:12, background:'var(--bg2)', border:'1px solid var(--bdr)', borderLeft:`4px solid ${SEV_BORDER[a.severity]||'var(--bdr)'}` }}>
              <div style={{ flexShrink:0, marginTop:2 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                  stroke={SEV_BORDER[a.severity]||'var(--bdr)'} strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 2L16.5 15H1.5L9 2zM9 7v4m0 2.5v.5"/>
                </svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                  <div style={{ fontWeight:500, fontSize:14, color:'var(--tx)' }}>{a.title}</div>
                  <span className={`badge badge-${SEV_COLOR[a.severity]||'gray'}`} style={{ textTransform:'capitalize', flexShrink:0 }}>
                    {a.severity} risk
                  </span>
                </div>
                <div style={{ fontSize:12, color:'var(--tx2)', marginBottom:8, lineHeight:1.6 }}>{a.description}</div>
                {a.visitorId && (
                  <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:8 }}>
                    Visitor: {a.visitorId.name}
                    {a.visitorId.phone ? ` · ${a.visitorId.phone}` : ''}
                    {a.visitorId.flatNumber ? ` · Flat ${a.visitorId.flatNumber}` : ''}
                  </div>
                )}
                <div style={{ fontSize:10, color:'var(--tx3)', fontFamily:'var(--mono)', marginBottom:12 }}>
                  {new Date(a.createdAt).toLocaleString()} · {a.reportedBy?.name || 'Auto-detected'}
                  {a.gateNumber ? ` · ${a.gateNumber}` : ''}
                  {a.flatNumber ? ` · Flat ${a.flatNumber}` : ''}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {a.severity === 'high' && (
                    <button className="btn btn-danger btn-sm" onClick={() => escalate(a._id)}>Escalate to police</button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => dismiss(a._id)}>Dismiss</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
