import React, { useEffect, useState } from 'react';
import { visitorsAPI, alertsAPI } from '../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function SuspiciousActivity() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const load = async () => {
    setLoading(true);
    try {
      const res = await visitorsAPI.getAll({ limit: 100 });
      setVisitors(res.data.visitors.filter(v => v.isSuspicious || v.isWatchlisted || v.flagCount > 1));
    } catch { toast.error(t('suspicious.failLoad', 'Failed to load data')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleWatchlist = async (id) => {
    try { await visitorsAPI.watchlist(id); toast.success(t('suspicious.addedWatchlist', 'Added to watchlist')); load(); }
    catch { toast.error(t('suspicious.fail', 'Failed')); }
  };

  const createAlert = async (v) => {
    try {
      await alertsAPI.create({
        title: `Manual flag: ${v.name}`,
        description: `Visitor ${v.name} (${v.phone}) manually flagged at Flat ${v.flatNumber}.`,
        severity: 'high', type: 'suspicious_pattern',
        flatNumber: v.flatNumber,
      });
      toast.success(t('suspicious.alertCreated', 'Alert created'));
    } catch { toast.error(t('suspicious.fail', 'Failed')); }
  };

  const high   = visitors.filter(v => v.flagCount >= 3);
  const medium = visitors.filter(v => v.flagCount >= 1 && v.flagCount < 3);

  const rules = [
    { label: t('suspicious.rule1', 'Failed entry threshold (3+ in 2 hr)'), status: 'active' },
    { label: t('suspicious.rule2', 'Expired OTP reuse detection'),           status: 'active' },
    { label: t('suspicious.rule3', 'Unusual visit frequency (flat-level)'),  status: 'active' },
    { label: t('suspicious.rule4', 'Tailgating detection (gate timing)'),    status: 'beta'   },
    { label: t('suspicious.rule5', 'Face mismatch AI detection'),            status: 'new'    },
  ];

  return (
    <div className="fade-in">
      {/* Risk summary */}
      <div className="grid3" style={{ marginBottom: 20 }}>
        {[
          { label: t('suspicious.highRisk', 'High risk'),       count: high.length,            color: 'var(--red)' },
          { label: t('suspicious.medRisk', 'Medium risk'),     count: medium.length,          color: 'var(--amb)' },
          { label: t('suspicious.totalFlagged', 'Total flagged'),   count: visitors.length,        color: 'var(--pri)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ height: 3, background: s.color, borderRadius: 2, marginBottom: 12 }} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{ marginBottom: 20 }}>
        {/* Flagged visitors table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--bdr)' }}>
            {t('suspicious.records', 'Flagged visitor records')}
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>{t('suspicious.visitor', 'Visitor')}</th><th>{t('suspicious.flags', 'Flags')}</th><th>{t('suspicious.reason', 'Reason')}</th><th>{t('suspicious.watch', 'Watch')}</th><th>{t('suspicious.actions', 'Actions')}</th></tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--tx3)', padding: 28 }}>{t('suspicious.noSuspicious', 'No suspicious activity detected')}</td></tr>
                ) : visitors.map(v => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{v.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>{v.phone}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${v.flagCount >= 3 ? 'red' : 'amber'}`}>{v.flagCount}×</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--tx2)', maxWidth: 140 }}>
                      {v.suspicionReason || t('suspicious.multiDenials', 'Multiple denials')}
                    </td>
                    <td>
                      {v.isWatchlisted
                        ? <span className="badge badge-amber">{t('suspicious.watchlisted', 'Watchlisted')}</span>
                        : <span className="badge badge-gray">{t('suspicious.no', 'No')}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!v.isWatchlisted && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleWatchlist(v._id)}>{t('suspicious.watchBtn', 'Watch')}</button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => createAlert(v)}>{t('suspicious.alertBtn', 'Alert')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detection rules */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>{t('suspicious.rulesActive', 'Detection rules active')}</div>
          {rules.map(r => {
            const color = r.status === 'active' ? 'var(--grn)' : r.status === 'beta' ? 'var(--amb)' : 'var(--pri)';
            const pct   = r.status === 'active' ? 100 : r.status === 'beta' ? 65 : 35;
            return (
              <div key={r.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>{r.label}</span>
                  <span className={`badge badge-${r.status === 'active' ? 'green' : r.status === 'beta' ? 'amber' : 'blue'}`} style={{ textTransform: 'capitalize' }}>
                    {r.status === 'new' ? t('suspicious.newBadge', 'NEW') : r.status}
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--tx2)' }}>
            {t('suspicious.rulesInfo', 'Rules run automatically on every entry event. Alerts are raised when thresholds are breached.')}
          </div>
        </div>
      </div>
    </div>
  );
}
