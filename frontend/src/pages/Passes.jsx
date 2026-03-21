import React, { useEffect, useState } from 'react';
import { visitorsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function Passes() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await visitorsAPI.getAll({ status: 'approved', limit: 30 });
      setPasses(res.data.visitors);
    } catch { toast.error('Failed to load passes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadQR = async (id, name) => {
    try {
      const res = await visitorsAPI.getQR(id);
      setQrModal({ img: res.data.qr, name });
    } catch { toast.error('Failed to load QR'); }
  };

  return (
    <div className="fade-in">
      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setQrModal(null)}>
          <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: 28, textAlign: 'center', minWidth: 200 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>QR Pass — {qrModal.name}</div>
            <img src={qrModal.img} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 10 }} />
            <div style={{ marginTop: 14 }}><button className="btn btn-ghost btn-sm" onClick={() => setQrModal(null)}>Close</button></div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Visitor</th><th>Flat</th><th>Purpose</th><th>Pass type</th><th>OTP</th><th>Valid</th><th>QR</th></tr>
            </thead>
            <tbody>
              {passes.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--tx3)', padding: 28 }}>No active passes</td></tr>
              ) : passes.map(p => (
                <tr key={p._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>{p.phone}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{p.flatNumber}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.purpose}</td>
                  <td>
                    <span className={`badge badge-${p.entryMethod === 'qr' ? 'green' : 'blue'}`} style={{ textTransform: 'uppercase' }}>
                      {p.entryMethod}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', letterSpacing: 2, fontWeight: 600, color: 'var(--pri)' }}>
                    {p.otpUsed ? <span className="badge badge-gray">Used</span> : (p.otp || '—')}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--tx3)' }}>
                    {p.validDate ? new Date(p.validDate).toLocaleDateString() : 'Today'}
                  </td>
                  <td>
                    {p.entryMethod === 'qr' ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => loadQR(p._id, p.name)}>View QR</button>
                    ) : <span style={{ color: 'var(--tx3)', fontSize: 12 }}>—</span>}
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
