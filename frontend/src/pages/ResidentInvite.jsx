import React, { useState } from 'react';
import { visitorsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function ResidentInvite() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name:'', phone:'', purpose:'guest',
    passType:'one-time', validDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [pass, setPass]       = useState(null);
  const [qrImg, setQrImg]     = useState(null);
  const { t } = useTranslation();

  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error(t('resInvite.reqFields', 'Name and phone are required'));
    setLoading(true);
    try {
      const r = await visitorsAPI.create({
        name: form.name, phone: form.phone, purpose: form.purpose,
        flatNumber: user.flatNumber,
        entryMethod: form.passType === 'qr' ? 'qr' : 'otp',
        passType: form.passType,
        validDate: form.validDate,
        status: 'approved',
      });
      setPass(r.data.visitor);
      if (form.passType === 'qr') {
        const qr = await visitorsAPI.getQR(r.data.visitor._id);
        setQrImg(qr.data.qr);
      }
      toast.success(t('resInvite.passGen', 'Pass generated — guard has been notified!'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('resInvite.failGen', 'Failed to generate pass'));
    } finally { setLoading(false); }
  };

  const reset = () => {
    setPass(null); setQrImg(null);
    setForm({ name:'', phone:'', purpose:'guest', passType:'one-time', validDate:new Date().toISOString().split('T')[0] });
  };

  if (pass) return (
    <div className="fade-in" style={{ maxWidth:480 }}>
      <div style={{ background:'var(--pri-lt)', border:'1.5px solid #bfdbfe', borderRadius:16, padding:22, marginBottom:16 }}>
        <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1.2px', color:'#1e40af', marginBottom:4 }}>
          {t('resInvite.passObj', 'Visitor pass')} · {pass.entryMethod.toUpperCase()}
        </div>
        <div style={{ fontSize:22, fontWeight:600, color:'var(--tx)', marginBottom:2 }}>{pass.name}</div>
        <div style={{ fontSize:13, color:'var(--pri)', marginBottom:16 }}>{t('resInvite.flatLabel', 'Flat')} {pass.flatNumber} · {user.name}</div>

        <div style={{ display:'flex', gap:20, marginBottom:16, flexWrap:'wrap' }}>
          {[[t('resInvite.purposeData', 'Purpose'), t(`admin.${pass.purpose}`, pass.purpose)], [t('resInvite.validData', 'Valid'), new Date(pass.validDate).toLocaleDateString()], [t('resInvite.typeData', 'Type'), t(`admin.${pass.passType}`, pass.passType)]].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize:10, color:'var(--tx3)', marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:13, fontFamily:'var(--mono)', textTransform:'capitalize' }}>{v}</div>
            </div>
          ))}
        </div>

        {qrImg ? (
          <div>
            <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:8 }}>{t('resInvite.qrPassInfo', 'QR pass (show to guard)')}</div>
            <img src={qrImg} alt="QR Code" style={{ width:140, height:140, borderRadius:10, border:'1px solid var(--bdr)', background:'#fff' }}/>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:8 }}>{t('resInvite.otpInfo', 'One-time entry OTP')}</div>
            <div style={{ display:'flex', gap:8, marginBottom:6 }}>
              {(pass.otp||'----').split('').map((d,i) => (
                <div key={i} className="otp-digit">{d}</div>
              ))}
            </div>
            <div style={{ fontSize:10, color:'var(--tx3)' }}>{t('resInvite.singleUse', 'Single-use · expires in 30 min')}</div>
          </div>
        )}
      </div>

      <div style={{ fontSize:12, color:'var(--tx3)', background:'var(--bg3)', padding:'10px 14px', borderRadius:8, marginBottom:14 }}>
        {t('resInvite.shareInfo', 'Share this OTP / QR code with your visitor. The guard has also been notified.')}
      </div>
      <button className="btn btn-ghost" onClick={reset}>{t('resInvite.genAnother', 'Generate another pass')}</button>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth:460 }}>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">{t('resInvite.visName', 'Visitor name *')}</label>
            <input className="form-input" value={form.name} onChange={e=>upd('name',e.target.value)} placeholder={t('resInvite.visNamePh', 'Full name of your visitor')}/>
          </div>
          <div className="form-group">
            <label className="form-label">{t('resInvite.phoneReq', 'Phone number *')}</label>
            <input className="form-input" value={form.phone} onChange={e=>upd('phone',e.target.value)} placeholder={t('resInvite.phonePh', '+91 xxxxxxxxxx')}/>
          </div>
          <div className="form-group">
            <label className="form-label">{t('resInvite.purposeLabel', 'Purpose of visit')}</label>
            <select className="form-input" value={form.purpose} onChange={e=>upd('purpose',e.target.value)}>
              <option value="guest">{t('resInvite.purpGuest', 'Guest / Family')}</option>
              <option value="maintenance">{t('resInvite.purpMaint', 'Plumber / Electrician')}</option>
              <option value="delivery">{t('resInvite.purpDel', 'Delivery')}</option>
              <option value="cab">{t('resInvite.purpCab', 'Cab / Ride')}</option>
              <option value="other">{t('resInvite.purpOther', 'Other')}</option>
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label className="form-label">{t('resInvite.visitDate', 'Visit date')}</label>
              <input className="form-input" type="date" value={form.validDate} onChange={e=>upd('validDate',e.target.value)}/>
            </div>
            <div>
              <label className="form-label">{t('resInvite.passType', 'Pass type')}</label>
              <select className="form-input" value={form.passType} onChange={e=>upd('passType',e.target.value)}>
                <option value="one-time">{t('resInvite.typeOtp', 'One-time OTP')}</option>
                <option value="qr">{t('resInvite.typeQr', 'QR pass')}</option>
                <option value="day-pass">{t('resInvite.typeDay', 'Day pass')}</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:11 }}>
            {loading
              ? <><span className="spinner" style={{ width:14, height:14, borderWidth:1.5 }}/>{t('resInvite.generating', 'Generating...')}</>
              : t('resInvite.genBtn', 'Generate pass & notify guard')}
          </button>
        </div>
      </form>
    </div>
  );
}
