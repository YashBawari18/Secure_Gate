import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Tooltip, Legend,
} from 'chart.js';
import { analyticsAPI } from '../utils/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GC = 'rgba(0,0,0,0.05)';
const TC = '#9ca3af';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getOverview()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div className="spinner" />
    </div>
  );

  const weeklyLabels = (data?.weekly || []).map(w => DAYS[(w._id - 1) % 7] || w._id);
  const approvedData = (data?.weekly || []).map(w => w.approved);
  const deniedData   = (data?.weekly || []).map(w => w.denied);
  const totalByDay   = (data?.weekly || []).map(w => (w.approved || 0) + (w.denied || 0));

  const purposeColors = {
    guest: '#2563eb', delivery: '#7c3aed',
    maintenance: '#d97706', cab: '#16a34a', other: '#dc2626',
  };

  return (
    <div className="fade-in">
      {/* KPI row */}
      <div className="grid4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total visitors (30d)', value: data?.total    || 0, color: 'var(--pri)' },
          { label: 'Unique visitors',      value: data?.unique   || 0, color: '#7c3aed'    },
          { label: 'Security incidents',   value: data?.incidents|| 0, color: 'var(--red)' },
          { label: 'Watchlisted',          value: data?.watchlisted||0, color: 'var(--amb)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ height: 3, background: s.color, borderRadius: 2, marginBottom: 12 }} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Weekly: approved vs denied</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--tx3)', marginBottom: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(22,163,74,.7)', display: 'inline-block' }} />Approved
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(220,38,38,.7)', display: 'inline-block' }} />Denied
            </span>
          </div>
          <div style={{ position: 'relative', height: 200 }}>
            <Bar
              data={{ labels: weeklyLabels, datasets: [
                { label: 'Approved', data: approvedData, backgroundColor: 'rgba(22,163,74,.7)', borderRadius: 3 },
                { label: 'Denied',   data: deniedData,   backgroundColor: 'rgba(220,38,38,.7)', borderRadius: 3 },
              ]}}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { x: { stacked: true, grid: { color: GC }, ticks: { color: TC, font: { size: 10 } } },
                          y: { stacked: true, grid: { color: GC }, ticks: { color: TC, font: { size: 10 } } } } }}
            />
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Total entries — trend</div>
          <div style={{ position: 'relative', height: 200 }}>
            <Line
              data={{ labels: weeklyLabels, datasets: [{
                data: totalByDay, borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,.08)',
                fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#2563eb',
              }]}}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { x: { grid: { color: GC }, ticks: { color: TC, font: { size: 10 } } },
                          y: { grid: { color: GC }, ticks: { color: TC, font: { size: 10 } } } } }}
            />
          </div>
        </div>
      </div>

      {/* Breakdown + Top flats */}
      <div className="grid2">
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Visitor type breakdown</div>
          {(data?.byPurpose || []).map(p => {
            const tot = (data.byPurpose || []).reduce((a, b) => a + b.count, 0);
            const pct = tot ? Math.round(p.count / tot * 100) : 0;
            return (
              <div key={p._id} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx2)', marginBottom: 4, textTransform: 'capitalize' }}>
                  <span>{p._id}</span><span style={{ fontFamily: 'var(--mono)' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: purposeColors[p._id] || 'var(--pri)', borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
          {(!data?.byPurpose || data.byPurpose.length === 0) && (
            <div style={{ color: 'var(--tx3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data yet</div>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--bdr)' }}>
            Top visited flats (30d)
          </div>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Flat</th><th>Visitors</th><th>Avg/wk</th><th>Risk</th></tr>
            </thead>
            <tbody>
              {(data?.topFlats || []).map((f, i) => (
                <tr key={f._id}>
                  <td style={{ color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{f._id}</td>
                  <td>{f.count}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{Math.round(f.count / 4)}</td>
                  <td><span className={`badge badge-${f.count > 40 ? 'amber' : 'green'}`}>{f.count > 40 ? 'Monitor' : 'Normal'}</span></td>
                </tr>
              ))}
              {(!data?.topFlats || data.topFlats.length === 0) && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--tx3)', padding: 24 }}>No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
