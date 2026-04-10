import React, { useEffect, useState } from 'react';
import { visitorsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function TrustScore() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Fetch all history (no status limit) to calculate true reputation
    visitorsAPI.getAll({ limit: 500 })
      .then(r => {
        const map = {};
        r.data.visitors.forEach(v => {
          if (!map[v.phone]) {
            map[v.phone] = {
              ...v,
              dynScore: 50, // Base Score
              historyLog: [],
            };
          }
          
          const record = map[v.phone];
          record.historyLog.push(v);

          // Algorithm computation based on historical events
          if (v.status === 'approved' || v.status === 'exited') record.dynScore += 5;
          if (v.status === 'denied' || v.status === 'flagged') record.dynScore -= 15;
          if (v.idVerified) record.dynScore += 15;
          if (v.flagCount > 0) record.dynScore -= (v.flagCount * 20);

          // Boundaries
          if (record.dynScore > 100) record.dynScore = 100;
          if (record.dynScore < 0) record.dynScore = 0;
          
          record.trustScore = record.dynScore; // Override the static database value
        });
        
        // Remove visitors that have zero approved visits (e.g. only pendings) to keep it clean
        const validTrusts = Object.values(map).filter(v => 
          v.historyLog.some(h => ['approved', 'exited', 'denied', 'flagged'].includes(h.status))
        );
        
        // Sort highest trust first
        setVisitors(validTrusts.sort((a,b) => b.trustScore - a.trustScore));
      })
      .catch(() => toast.error('Failed to load visitor scores'))
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = s => s >= 80 ? 'var(--grn)' : s >= 60 ? 'var(--amb)' : 'var(--red)';
  const scoreBg    = s => s >= 80 ? 'var(--grn-lt)' : s >= 60 ? 'var(--amb-lt)' : 'var(--red-lt)';
  const scoreLabel = s => s >= 80 ? 'Trusted visitor' : s >= 60 ? 'Building trust' : 'Low trust';

  const tags = (v) => {
    const t = [];
    if (v.idVerified)     t.push({ label: 'ID verified',       cls: 'green' });
    if (v.trustScore >= 80) t.push({ label: 'Trusted',         cls: 'green' });
    if (v.flagCount > 0)  t.push({ label: `${v.flagCount}× flagged`, cls: 'red' });
    if (!v.idVerified)    t.push({ label: 'Unverified ID',     cls: 'amber' });
    return t.slice(0, 2);
  };

  return (
    <div className="fade-in">
      <div className="info-box" style={{ marginBottom: 18 }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#2563eb" strokeWidth="1.3">
          <circle cx="6.5" cy="6.5" r="5.5"/><line x1="6.5" y1="4.5" x2="6.5" y2="6.5"/><circle cx="6.5" cy="8.5" r=".5" fill="#2563eb"/>
        </svg>
        Each visitor builds a trust score (0–100) based on visit history, ID verification, and flag count.
        Trusted regulars can be pre-approved automatically.
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : visitors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--tx3)' }}>
          <div style={{ fontWeight: 500 }}>No visitor trust data yet</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Scores appear after visitors have made at least one approved entry</div>
        </div>
      ) : (
        <div className="grid3">
          {visitors.map(v => {
            const s = v.trustScore || 50;
            const ring = Math.round((s / 100) * 163); // circumference ~163 for r=26
            return (
              <div key={v._id} className="card" style={{ textAlign: 'center' }}>
                <div className="avatar" style={{ width: 44, height: 44, margin: '0 auto 10px', fontSize: 15, background: scoreBg(s), color: scoreColor(s) }}>
                  {v.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{v.name}</div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 14 }}>
                  {v.phone} · Flat {v.flatNumber}
                </div>

                {/* Score ring */}
                <div style={{ position: 'relative', width: 70, height: 70, margin: '0 auto 10px' }}>
                  <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="35" cy="35" r="26" fill="none" stroke="var(--bg3)" strokeWidth="7" />
                    <circle cx="35" cy="35" r="26" fill="none" stroke={scoreColor(s)} strokeWidth="7"
                      strokeDasharray="163" strokeDashoffset={163 - ring} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)', color: scoreColor(s) }}>
                    {s}
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 10 }}>{scoreLabel(s)}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                  {tags(v).map(t => (
                    <span key={t.label} className={`badge badge-${t.cls}`}>{t.label}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
