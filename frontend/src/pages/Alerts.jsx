import React, { useEffect, useState } from 'react';
import { alertsAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SEV_BORDER = { high:'var(--red)', medium:'var(--amb)', low:'var(--pri)' };
const SEV_COLOR  = { high:'red',        medium:'amber',      low:'blue'       };

export default function Alerts() {
  const { user } = useAuth();
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', severity: 'medium', description: '', flatNumber: '', type: 'other' });

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

  const handleAlertSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Title and description are required');
    try {
      await alertsAPI.create(form);
      toast.success('Alert broadcasted securely!');
      setShowForm(false);
      setForm({ title: '', severity: 'medium', description: '', flatNumber: '', type: 'other' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to dispatch alert'); }
  };

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:13, color:'var(--tx2)' }}>
          {loading ? '—' : alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
          {(user?.role === 'admin' || user?.role === 'guard') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Raise New Alert'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--red)' }}>Manually Broadcast Threat Alert</div>
          <form onSubmit={handleAlertSubmit}>
            <div className="grid2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Threat Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Broken Gate Sensor" />
              </div>
              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select className="form-input" value={form.severity} onChange={e => setForm(f => ({...f, severity: e.target.value}))}>
                  <option value="low">Low (Notice)</option>
                  <option value="medium">Medium (Warning)</option>
                  <option value="high">High (Critical Threat)</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="form-label">Description *</label>
                <textarea className="form-input" style={{ minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Provide details securely..." />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Affected Flat (Optional)</label>
                <input className="form-input" value={form.flatNumber} onChange={e => setForm(f => ({...f, flatNumber: e.target.value}))} placeholder="e.g. 104B" />
              </div>
            </div>
            <button type="submit" className="btn btn-danger btn-sm">Broadcast to All Stations</button>
          </form>
        </div>
      )}

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
                    <a
                      href="tel:112"
                      className="btn btn-danger btn-sm"
                      style={{ textDecoration: 'none' }}
                      onClick={(e) => {
                        // Also mark as escalated in the system
                        escalate(a._id);
                      }}
                    >
                      🚨 Call Emergency (112)
                    </a>
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
