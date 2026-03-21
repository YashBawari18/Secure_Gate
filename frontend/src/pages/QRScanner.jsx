import React, { useState } from 'react';
import { visitorsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import Scanner from '../components/Scanner';

export default function QRScanner() {
  const [otp, setOtp]         = useState(['', '', '', '']);
  const [phone, setPhone]     = useState('');
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const focusNext = (e, idx) => {
    if (e.target.value && idx < 3) {
      e.target.parentElement.children[idx + 1]?.focus();
    }
  };

  const updateOtp = (val, idx) => {
    const next = [...otp];
    next[idx] = val.replace(/\D/, '').slice(-1);
    setOtp(next);
  };

  const handleOTP = async () => {
    const code = otp.join('');
    if (code.length < 4) return toast.error('Enter full 4-digit OTP');
    if (!phone)          return toast.error('Enter visitor phone number');
    setLoading(true);
    try {
      const res = await visitorsAPI.verifyOTP({ otp: code, phone });
      setLastResult({ success: true, visitor: res.data.visitor, method: 'OTP' });
      setOtp(['', '', '', '']); setPhone('');
      toast.success('OTP verified — entry granted!');
    } catch (err) {
      setLastResult({ success: false, message: err.response?.data?.message || 'Verification failed' });
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleQR = async () => {
    if (!qrToken) return toast.error('Enter QR token');

    let tokenToVerify = qrToken;
    try {
      const parsed = JSON.parse(qrToken);
      if (parsed.token) tokenToVerify = parsed.token;
    } catch (e) { /* ignore */ }

    setLoading(true);
    try {
      const res = await visitorsAPI.verifyQR({ qrToken: tokenToVerify });
      setLastResult({ success: true, visitor: res.data.visitor, method: 'QR' });
      setQrToken('');
      toast.success('QR verified — entry granted!');
    } catch (err) {
      setLastResult({ success: false, message: err.response?.data?.message || 'Invalid QR' });
      toast.error(err.response?.data?.message || 'Invalid QR');
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      {lastResult && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: lastResult.success ? 'var(--grn-lt)' : 'var(--red-lt)', border: `1px solid ${lastResult.success ? '#86efac' : '#fca5a5'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: lastResult.success ? 'var(--grn)' : 'var(--red)' }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: lastResult.success ? '#15803d' : '#b91c1c' }}>
              {lastResult.success ? `${lastResult.method} verified — entry granted for ${lastResult.visitor?.name}` : lastResult.message}
            </div>
          </div>
          {lastResult.success && lastResult.visitor && (
            <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 6, paddingLeft: 16 }}>
              Flat {lastResult.visitor.flatNumber} · {lastResult.visitor.purpose}
            </div>
          )}
        </div>
      )}

      <div className="grid2">
        {/* OTP panel */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>OTP verification</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {otp.map((d, i) => (
              <input key={i} maxLength={1} value={d}
                onChange={e => { updateOtp(e.target.value, i); focusNext(e, i); }}
                onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) e.target.parentElement.children[i - 1]?.focus(); }}
                style={{ width: 52, height: 58, textAlign: 'center', fontSize: 26, fontWeight: 600, fontFamily: 'var(--mono)', background: d ? 'var(--pri-lt)' : 'var(--bg3)', border: `1.5px solid ${d ? 'var(--pri)' : 'var(--bdr2)'}`, borderRadius: 10, color: 'var(--pri)', outline: 'none', transition: 'all .15s' }}
              />
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Visitor phone (for lookup)</label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 xxxxxxxxxx" />
          </div>

          <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: 10 }}
            onClick={handleOTP} disabled={loading || otp.join('').length < 4}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />Verifying...</> : 'Verify OTP & allow entry'}
          </button>
        </div>

        {/* QR panel */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>QR code scan</div>

          <Scanner onScan={(text) => setQrToken(text)} />

          <div className="form-group">
            <label className="form-label">Or paste QR token manually</label>
            <input className="form-input" value={qrToken} onChange={e => setQrToken(e.target.value)} placeholder="Paste token from visitor's pass..." />
          </div>

          <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: 10 }}
            onClick={handleQR} disabled={loading || !qrToken}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />Verifying...</> : 'Verify QR & allow entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
