import React, { useEffect, useState } from 'react';
import { visitorsAPI } from '../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function Watchlist() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { t } = useTranslation();

  const load = async () => {
    setLoading(true);
    try {
      const res = await visitorsAPI.getAll({ limit: 100 });
      setVisitors(res.data.visitors.filter(v => v.isWatchlisted));
    } catch { toast.error(t('watchlist.failLoad', 'Failed to load watchlist')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggleWatchlist = async (id, currentlyWatchlisted) => {
    try {
      await visitorsAPI.watchlist(id);
      toast.success(currentlyWatchlisted ? t('watchlist.removed', 'Removed from watchlist') : t('watchlist.added', 'Added to watchlist'));
      load();
    } catch { toast.error(t('watchlist.failUpdate', 'Failed to update watchlist')); }
  };

  return (
    <div className="fade-in">
      <div className="info-box" style={{ marginBottom: 16 }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#2563eb" strokeWidth="1.3">
          <circle cx="6.5" cy="6.5" r="5.5"/><line x1="6.5" y1="4.5" x2="6.5" y2="6.5"/><circle cx="6.5" cy="8.5" r=".5" fill="#2563eb"/>
        </svg>
        {t('watchlist.infoAlert', 'Guards receive an instant alert if any watchlisted visitor attempts entry. List is shared across all gates.')}
      </div>

      <div className="grid3" style={{ marginBottom: 18 }}>
        {[
          { label: t('watchlist.totalWatchlisted', 'Total watchlisted'), count: visitors.length,                             color: 'var(--red)' },
          { label: t('watchlist.highRisk', 'High risk (3+ flags)'), count: visitors.filter(v => v.flagCount >= 3).length, color: 'var(--amb)' },
          { label: t('watchlist.recentAdditions', 'Recent additions'),  count: visitors.filter(v => {
              const d = new Date(v.updatedAt || v.createdAt);
              return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
            }).length, color: 'var(--pri)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ height: 3, background: s.color, borderRadius: 2, marginBottom: 10 }} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>{t('visitorLog.visitor', 'Visitor')}</th><th>{t('watchlist.phone', 'Phone')}</th><th>{t('watchlist.addedCol', 'Added')}</th><th>{t('watchlist.flagCount', 'Flag count')}</th><th>{t('watchlist.reason', 'Reason')}</th><th>{t('watchlist.risk', 'Risk')}</th><th>{t('watchlist.action', 'Action')}</th></tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--tx3)', padding: 32 }}>{t('watchlist.empty', 'Watchlist is empty — no threats detected')}</td></tr>
              ) : visitors.map(v => (
                <tr key={v._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, background: 'var(--red-lt)', color: 'var(--red)' }}>
                        {v.name === 'Unknown' ? '??' : v.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ fontWeight: 500 }}>{v.name === 'Unknown' ? t('admin.unknown', 'Unknown') : v.name}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{v.phone}</td>
                  <td style={{ fontSize: 12, color: 'var(--tx3)' }}>
                    {new Date(v.updatedAt || v.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge badge-${v.flagCount >= 3 ? 'red' : 'amber'}`}>{v.flagCount}×</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--tx2)', maxWidth: 180 }}>
                    {v.suspicionReason || t('watchlist.manuallyAdded', 'Manually added')}
                  </td>
                  <td>
                    <span className={`badge badge-${v.flagCount >= 3 ? 'red' : 'amber'}`}>
                      {v.flagCount >= 3 ? t('watchlist.high', 'High') : t('watchlist.medium', 'Medium')}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${v.isWatchlisted ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => handleToggleWatchlist(v._id, v.isWatchlisted)}
                    >
                      {v.isWatchlisted ? t('watchlist.removeBtn', 'Remove') : t('watchlist.watchBtn', '+ Watch')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
