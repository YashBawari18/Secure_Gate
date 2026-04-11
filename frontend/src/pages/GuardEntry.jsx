import React, { useState } from 'react';
import { visitorsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Scanner from '../components/Scanner';

export default function GuardEntry() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name:'', phone:'', flatNumber:'', purpose:'guest', entryMethod:'otp' });
  const [loading,  setLoading]  = useState(false);
  const [created,  setCreated]  = useState(null);
  const [otp,      setOtp]      = useState(['','','','']);
  const [otpPhone, setOtpPhone] = useState('');
  const [qrToken,  setQrToken]  = useState('');
  const [verifying, setVerifying] = useState(false);
  const [recent,   setRecent]   = useState([]);
  const { t } = useTranslation();

  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const focusOtp = (e, idx) => {
    if (e.target.value && idx < 3) e.target.parentElement.children[idx+1]?.focus();
  };
  const updateOtp = (val, idx) => {
    const next = [...otp]; next[idx] = val.replace(/\D/,'').slice(-1); setOtp(next);
  };

  const createEntry = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.flatNumber) return toast.error(t('guard.namePhoneFlatRequired', 'Name, phone and flat are required'));
    setLoading(true);
    try {
      const r = await visitorsAPI.create({ ...form, guardId: user._id });
      setCreated(r.data.visitor);
      setRecent(prev => [r.data.visitor, ...prev].slice(0,5));
      toast.success(t('guard.notifyingResident', 'Entry created — notifying resident...'));
      setForm({ name:'', phone:'', flatNumber:'', purpose:'guest', entryMethod:'otp' });
    } catch (err) { toast.error(err.response?.data?.message || t('guard.failedToCreate', 'Failed to create entry')); }
    finally { setLoading(false); }
  };

  const denyEntry = () => {
    setCreated(null);
    toast(t('guard.entryDenied', 'Entry denied and flagged'));
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 4)  return toast.error(t('guard.enter4Digit', 'Enter 4-digit OTP'));
    if (!otpPhone)        return toast.error(t('guard.enterVisitorPhone', 'Enter visitor phone'));
    setVerifying(true);
    try {
      await visitorsAPI.verifyOTP({ otp: code, phone: otpPhone });
      toast.success(t('guard.otpVerified', 'OTP verified — entry granted!'));
      setOtp(['','','','']); setOtpPhone(''); setCreated(null);
    } catch (err) { toast.error(err.response?.data?.message || t('guard.otpVerificationFailed', 'OTP verification failed')); }
    finally { setVerifying(false); }
  };

  const verifyQR = async () => {
    if (!qrToken) return toast.error(t('guard.enterQrToken', 'Enter QR token'));
    
    let tokenToVerify = qrToken;
    try {
      const parsed = JSON.parse(qrToken);
      if (parsed.token) tokenToVerify = parsed.token;
    } catch (e) { /* ignore, it's a raw string */ }

    setVerifying(true);
    try {
      await visitorsAPI.verifyQR({ qrToken: tokenToVerify });
      toast.success(t('guard.qrVerified', 'QR verified — entry granted!'));
      setQrToken('');
    } catch (err) { toast.error(err.response?.data?.message || t('guard.qrVerificationFailed', 'QR verification failed')); }
    finally { setVerifying(false); }
  };

  const STATUS_DOT = { approved:'var(--grn)', pending:'var(--amb)', denied:'var(--red)', flagged:'var(--red)' };

  return (
    <div className="fade-in">
      <div className="grid2">

        {/* ── Entry form ── */}
        <div>
          <div className="card" style={{ marginBottom:14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{t('guard.registerNewVisitor', 'Register new visitor')}</div>
              <button type="button" onClick={() => setForm({ name: 'Hackathon Judge', phone: '+91 9876543210', flatNumber: 'A-501', purpose: 'guest', entryMethod: 'otp' })} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px dashed #3b82f6', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>⚡ Demo Fill</button>
            </div>
            <form onSubmit={createEntry}>
               <div className="form-group">
                <label className="form-label">{t('guard.visitorName', 'Visitor name *')}</label>
                <input className="form-input" value={form.name} onChange={e=>upd('name',e.target.value)} placeholder={t('guard.fullName', 'Full name')}/>
              </div>
              <div className="form-group">
                <label className="form-label">{t('guard.phoneNumber', 'Phone number *')}</label>
                <input className="form-input" value={form.phone} onChange={e=>upd('phone',e.target.value)} placeholder="+91 xxxxxxxxxx"/>
              </div>
              <div className="form-group">
                <label className="form-label">{t('guard.flatNumber', 'Flat number *')}</label>
                <input className="form-input" value={form.flatNumber} onChange={e=>upd('flatNumber',e.target.value)} placeholder={t('guard.egFlat', 'e.g. 2A, 7C')}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label className="form-label">{t('guard.purpose', 'Purpose')}</label>
                  <select className="form-input" value={form.purpose} onChange={e=>upd('purpose',e.target.value)}>
                    <option value="guest">{t('admin.guest', 'Guest')}</option>
                    <option value="delivery">{t('admin.delivery', 'Delivery')}</option>
                    <option value="maintenance">{t('admin.maintenance', 'Maintenance')}</option>
                    <option value="cab">{t('admin.cab', 'Cab/Ride')}</option>
                    <option value="other">{t('admin.other', 'Other')}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('guard.passType', 'Pass type')}</label>
                  <select className="form-input" value={form.entryMethod} onChange={e=>upd('entryMethod',e.target.value)}>
                    <option value="otp">OTP</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:10 }}>
                {loading ? <><span className="spinner" style={{ width:14, height:14, borderWidth:1.5 }}/>{t('guard.creating', 'Creating...')}</> : t('guard.createEntry', 'Create entry & notify resident')}
              </button>
              <button type="button" className="btn btn-danger" style={{ width:'100%', justifyContent:'center', padding:10, marginTop:8 }} onClick={denyEntry}>
                {t('guard.denyEntryFlag', 'Deny entry & flag visitor')}
              </button>
            </form>
          </div>

          {/* Created confirmation */}
          {created && (
            <div style={{ padding:14, borderRadius:10, background:'var(--grn-lt)', border:'1px solid #86efac' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--grn)' }}/>
                <div style={{ fontSize:13, fontWeight:500, color:'#15803d' }}>{t('guard.entryCreated', 'Entry created — waiting for resident')}</div>
              </div>
              <div style={{ fontSize:12, color:'#166534' }}>
                <strong>{created.name}</strong> · {t('admin.flat', 'Flat')} {created.flatNumber}<br/>
                {t('guard.otpWillBeSent', 'OTP will be sent to resident for approval.')}
              </div>
            </div>
          )}
        </div>

        {/* ── Verification + Gate log ── */}
        <div>

          {/* Recent entries timeline */}
          {recent.length > 0 && (
            <div className="card">
              <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>{t('guard.recentAtGate', 'Recent at this gate')}</div>
              <div className="timeline">
                {recent.map(v => (
                  <div key={v._id} className="timeline-item">
                    <div className={`timeline-dot ${v.status==='approved'?'green':v.status==='denied'?'red':v.status==='pending'?'amber':'blue'}`}/>
                    <div style={{ fontSize:13, fontWeight:500 }}>{v.name} · {t('admin.flat', 'Flat')} {v.flatNumber}</div>
                    <div style={{ fontSize:11, color:'var(--tx3)' }}>{t('admin.' + v.purpose, v.purpose)} · {t('admin.method.'+v.entryMethod, v.entryMethod)?.toUpperCase() || v.entryMethod.toUpperCase()} · {new Date(v.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
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
