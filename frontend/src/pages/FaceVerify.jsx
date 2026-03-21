import React, { useState } from 'react';

const QUEUE = [
  { id: 1, name: 'Arjun Kapoor',  flat: '6B', match: 96, status: 'match',   time: '11:02 AM', approved: true  },
  { id: 2, name: 'Unknown male',  flat: '3D', match: 0,  status: 'no-match', time: '10:58 AM', approved: false },
  { id: 3, name: 'Sunita Rao',    flat: '1C', match: 74, status: 'low',      time: '10:45 AM', approved: null  },
];

export default function FaceVerify() {
  const [queue, setQueue] = useState(QUEUE);

  const decide = (id, allow) => {
    setQueue(q => q.map(item => item.id === id ? { ...item, approved: allow, decided: true } : item));
  };

  const matchColor = m => m >= 85 ? 'var(--grn)' : m >= 70 ? 'var(--amb)' : 'var(--red)';
  const matchBadge = m => m >= 85 ? 'green' : m >= 70 ? 'amber' : 'red';
  const matchLabel = m => m >= 85 ? `Match ${m}%` : m === 0 ? 'No match' : `Low ${m}%`;

  return (
    <div className="fade-in">
      <div className="info-box" style={{ marginBottom: 18 }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#2563eb" strokeWidth="1.3">
          <circle cx="6.5" cy="6.5" r="5.5"/><line x1="6.5" y1="4.5" x2="6.5" y2="6.5"/><circle cx="6.5" cy="8.5" r=".5" fill="#2563eb"/>
        </svg>
        AI compares live gate photos against resident-submitted visitor IDs. Mismatch triggers a security alert.
      </div>

      <div className="grid2" style={{ marginBottom: 20 }}>
        {/* Verification queue */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Verification queue</div>
            <span className="badge badge-blue">{queue.filter(q => q.approved === null).length} pending</span>
          </div>
          {queue.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--bdr)' }}>
              <div className="avatar" style={{ width: 34, height: 34, fontSize: 12, background: v.match === 0 ? 'var(--red-lt)' : 'var(--bg3)', color: v.match === 0 ? 'var(--red)' : 'var(--tx2)' }}>
                {v.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{v.name}</div>
                <div style={{ fontSize: 11, color: 'var(--tx3)' }}>Flat {v.flat} · {v.time}</div>
              </div>
              <span className={`badge badge-${matchBadge(v.match)}`}>{matchLabel(v.match)}</span>
              {v.decided ? (
                <span className={`badge badge-${v.approved ? 'green' : 'red'}`}>{v.approved ? 'Allowed' : 'Denied'}</span>
              ) : (
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="btn btn-success btn-sm" onClick={() => decide(v.id, true)}>Allow</button>
                  <button className="btn btn-danger btn-sm"  onClick={() => decide(v.id, false)}>Deny</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Accuracy panel */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Accuracy this month</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
            {/* Ring */}
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg3)" strokeWidth="8"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--pri)" strokeWidth="8"
                  strokeDasharray="201" strokeDashoffset="12" strokeLinecap="round"/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--pri)' }}>94%</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--tx)' }}>284</div>
              <div style={{ fontSize: 12, color: 'var(--tx3)' }}>verifications run</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--grn)', marginTop: 8 }}>267</div>
              <div style={{ fontSize: 12, color: 'var(--tx3)' }}>matched correctly</div>
            </div>
          </div>
          {[
            { label: 'True match (correct allow)',     pct: 79, color: 'var(--grn)' },
            { label: 'Mismatch flagged',               pct: 15, color: 'var(--red)' },
            { label: 'Low confidence (manual review)', pct: 6,  color: 'var(--amb)' },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx2)', marginBottom: 4 }}>
                <span>{r.label}</span><span style={{ fontFamily: 'var(--mono)' }}>{r.pct}%</span>
              </div>
              <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--tx2)' }}>
            Integrate your CV model at <span style={{ fontFamily: 'var(--mono)', color: 'var(--pri)' }}>POST /api/visitors/face-check</span> to enable live matching.
          </div>
        </div>
      </div>
    </div>
  );
}
