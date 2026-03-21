import React, { useEffect, useState } from 'react';
import { visitorsAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await visitorsAPI.getAll({ limit: 20 });
      // Build notification list from recent visitor events
      const notifs = res.data.visitors.map(v => ({
        id: v._id,
        title: v.status === 'pending'  ? `${v.name} is at the gate` :
               v.status === 'approved' ? `${v.name} entry approved` :
               v.status === 'denied'   ? `${v.name} entry denied`   :
               v.status === 'exited'   ? `${v.name} has exited`     : `${v.name} — ${v.status}`,
        desc: `Flat ${v.flatNumber} · ${v.purpose} · OTP: ${v.otpUsed ? 'Used' : (v.otp || '—')}`,
        time: new Date(v.createdAt),
        unread: v.status === 'pending',
        type: v.status,
      }));
      setItems(notifs);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useSocket((event, data) => {
    if (event === 'approval_request') {
      setItems(prev => [{
        id: Date.now(), title: `${data.visitor.name} is at the gate`,
        desc: `Flat ${data.visitor.flatNumber} · ${data.visitor.purpose}`,
        time: new Date(), unread: true, type: 'pending',
      }, ...prev]);
      toast('New visitor at the gate!');
    }
  });

  const typeColor = { pending: 'var(--amb)', approved: 'var(--grn)', denied: 'var(--red)', exited: 'var(--tx3)' };

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - date) / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} hr ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
          {items.filter(i => i.unread).length} unread
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--tx3)' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--bdr2)" strokeWidth="2" style={{ marginBottom: 12 }}>
            <path d="M20 4a14 14 0 0114 14v9l4 7H2l4-7V18A14 14 0 0120 4zM16 36a4 4 0 008 0"/>
          </svg>
          <div style={{ fontWeight: 500 }}>No notifications yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 10, background: 'var(--bg2)', border: `1px solid ${n.unread ? '#bfdbfe' : 'var(--bdr)'}`, background: n.unread ? 'var(--pri-lt)' : 'var(--bg2)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor[n.type] || 'var(--tx3)', flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: n.unread ? 500 : 400, color: 'var(--tx)' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>{n.desc}</div>
                <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4, fontFamily: 'var(--mono)' }}>{timeAgo(n.time)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
