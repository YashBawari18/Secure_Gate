import React, { useState } from 'react';
import { visitorsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Scanner from '../components/Scanner';

export default function GuardEntry() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name:'', phone:'', flatNumber:'', purpose:'guest', entryMethod:'manual' });
  const [loading,  setLoading]  = useState(false);
  const [created,  setCreated]  = useState(null);
  const [otp,      setOtp]      = useState(['','','','']);
  const [otpPhone, setOtpPhone] = useState('');
  const [qrToken,  setQrToken]  = useState('');
  const [verifying, setVerifying] = useState(false);
  const [recent,   setRecent]   = useState([]);

  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const focusOtp = (e, idx) => {
    if (e.target.value && idx < 3) e.target.parentElement.children[idx+1]?.focus();
  };
  const updateOtp = (val, idx) => {
    const next = [...otp]; next[idx] = val.replace(/\D/,'').slice(-1); setOtp(next);
  };

  const createEntry = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.flatNumber) return toast.error('Name, phone and flat are required');
    setLoading(true);
    try {
      const r = await visitorsAPI.create({ ...form, guardId: user._id });
      setCreated(r.data.visitor);
      setRecent(prev => [r.data.visitor, ...prev].slice(0,5));
      toast.success('Entry created — notifying resident...');
      setForm({ name:'', phone:'', flatNumber:'', purpose:'guest', entryMethod:'manual' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create entry'); }
    finally { setLoading(false); }
  };

  const denyEntry = () => {
    setCreated(null);
    toast('Entry denied and flagged');
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 4)  return toast.error('Enter 4-digit OTP');
    if (!otpPhone)        return toast.error('Enter visitor phone');
    setVerifying(true);
    try {
      await visitorsAPI.verifyOTP({ otp: code, phone: otpPhone });
      toast.success('OTP verified — entry granted!');
      setOtp(['','','','']); setOtpPhone(''); setCreated(null);
    } catch (err) { toast.error(err.response?.data?.message || 'OTP verification failed'); }
    finally { setVerifying(false); }
  };

  const verifyQR = async () => {
    if (!qrToken) return toast.error('Enter QR token');
    
    let tokenToVerify = qrToken;
    try {
      const parsed = JSON.parse(qrToken);
      if (parsed.token) tokenToVerify = parsed.token;
    } catch (e) { /* ignore, it's a raw string */ }

    setVerifying(true);
    try {
      await visitorsAPI.verifyQR({ qrToken: tokenToVerify });
      toast.success('QR verified — entry granted!');
      setQrToken('');
    } catch (err) { toast.error(err.response?.data?.message || 'QR verification failed'); }
    finally { setVerifying(false); }
  };

  const STATUS_DOT = { approved:'var(--grn)', pending:'var(--amb)', denied:'var(--red)', flagged:'var(--red)' };

  return (
    <div className="fade-in">
      <div className="grid2">

        {/* ── Entry form ── */}
        <div>
          <div className="card" style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:16 }}>Register new visitor</div>
            <form onSubmit={createEntry}>
              <div className="form-group">
                <label className="form-label">Visitor name *</label>
                <input className="form-input" value={form.name} onChange={e=>upd('name',e.target.value)} placeholder="Full name"/>
              </div>
              <div className="form-group">
                <label className="form-label">Phone number *</label>
                <input className="form-input" value={form.phone} onChange={e=>upd('phone',e.target.value)} placeholder="+91 xxxxxxxxxx"/>
              </div>
              <div className="form-group">
                <label className="form-label">Flat number *</label>
                <input className="form-input" value={form.flatNumber} onChange={e=>upd('flatNumber',e.target.value)} placeholder="e.g. 2A, 7C"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label className="form-label">Purpose</label>
                  <select className="form-input" value={form.purpose} onChange={e=>upd('purpose',e.target.value)}>
                    <option value="guest">Guest</option>
                    <option value="delivery">Delivery</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="cab">Cab/Ride</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Pass type</label>
                  <select className="form-input" value={form.entryMethod} onChange={e=>upd('entryMethod',e.target.value)}>
                    <option value="manual">Manual</option>
                    <option value="otp">OTP</option>
                    <option value="qr">QR</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:10 }}>
                {loading ? <><span className="spinner" style={{ width:14, height:14, borderWidth:1.5 }}/>Creating...</> : 'Create entry & notify resident'}
              </button>
              <button type="button" className="btn btn-danger" style={{ width:'100%', justifyContent:'center', padding:10, marginTop:8 }} onClick={denyEntry}>
                Deny entry &amp; flag visitor
              </button>
            </form>
          </div>

          {/* Created confirmation */}
          {created && (
            <div style={{ padding:14, borderRadius:10, background:'var(--grn-lt)', border:'1px solid #86efac' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--grn)' }}/>
                <div style={{ fontSize:13, fontWeight:500, color:'#15803d' }}>Entry created — waiting for resident</div>
              </div>
              <div style={{ fontSize:12, color:'#166534' }}>
                <strong>{created.name}</strong> · Flat {created.flatNumber}<br/>
                OTP will be sent to resident for approval.
              </div>
            </div>
          )}
        </div>

        {/* ── Verification + Gate log ── */}
        <div>
          {/* OTP verify */}
          <div className="card" style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:14 }}>Verify OTP</div>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              {otp.map((d,i) => (
                <input key={i} maxLength={1} value={d}
                  onChange={e=>{ updateOtp(e.target.value,i); focusOtp(e,i); }}
                  onKeyDown={e=>{ if(e.key==='Backspace'&&!d&&i>0) e.target.parentElement.children[i-1]?.focus(); }}
                  style={{ width:46, height:52, textAlign:'center', fontSize:24, fontWeight:600, fontFamily:'var(--mono)', background: d?'var(--pri-lt)':'var(--bg3)', border:`1.5px solid ${d?'var(--pri)':'var(--bdr2)'}`, borderRadius:9, color:'var(--pri)', outline:'none', transition:'all .15s' }}
                />
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Visitor phone (for OTP lookup)</label>
              <input className="form-input" value={otpPhone} onChange={e=>setOtpPhone(e.target.value)} placeholder="Phone number used at entry"/>
            </div>
            <button className="btn btn-success" style={{ width:'100%', justifyContent:'center', padding:9 }}
              onClick={verifyOTP} disabled={verifying || otp.join('').length<4}>
              {verifying ? 'Verifying...' : 'Verify OTP & allow entry'}
            </button>
          </div>

          {/* QR verify */}
          <div className="card" style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Verify QR pass</div>
            <Scanner onScan={(text) => setQrToken(text)} />
            <input className="form-input" value={qrToken} onChange={e=>setQrToken(e.target.value)} placeholder="Or paste QR token manually" style={{ marginBottom:10 }}/>
            <button className="btn btn-success" style={{ width:'100%', justifyContent:'center', padding:9 }}
              onClick={verifyQR} disabled={verifying || !qrToken}>
              {verifying ? 'Verifying...' : 'Verify QR & allow entry'}
            </button>
          </div>

          {/* Recent entries timeline */}
          {recent.length > 0 && (
            <div className="card">
              <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Recent at this gate</div>
              <div className="timeline">
                {recent.map(v => (
                  <div key={v._id} className="timeline-item">
                    <div className={`timeline-dot ${v.status==='approved'?'green':v.status==='denied'?'red':v.status==='pending'?'amber':'blue'}`}/>
                    <div style={{ fontSize:13, fontWeight:500 }}>{v.name} · Flat {v.flatNumber}</div>
                    <div style={{ fontSize:11, color:'var(--tx3)' }}>{v.purpose} · {v.entryMethod.toUpperCase()} · {new Date(v.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
