import React, { useEffect, useState, useCallback } from 'react';
import { visitorsAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const PURPOSE_META = {
  guest:       { color:'var(--pri)', bg:'#eff4ff',       label:'Guest'       },
  delivery:    { color:'var(--grn)', bg:'var(--grn-lt)', label:'Delivery'    },
  maintenance: { color:'var(--amb)', bg:'var(--amb-lt)', label:'Maintenance' },
  cab:         { color:'#7c3aed',    bg:'#f5f3ff',       label:'Cab/Ride'    },
  other:       { color:'var(--tx2)', bg:'var(--bg3)',     label:'Other'       },
};

export default function ResidentApprovals() {
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState({});
  const { t } = useTranslation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await visitorsAPI.getAll({ status:'pending', limit:20 });
      setPending(r.data.visitors);
    } catch { toast.error(t('resident.failedLoad', 'Failed to load approvals')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useSocket((event, data) => {
    if (event === 'approval_request') {
      toast(`${data.visitor.name} ${t('resident.isAtGate', 'is at the gate!')}`);
      load();
    }
  });

  const approve = async (id, name) => {
    setActing(a => ({...a, [id]:'approving'}));
    try {
      const resp = await visitorsAPI.approve(id);
      const testOtp = resp.data?.visitor?.otp || '';
      toast.success(`${name} ${t('resident.approvedOtp', 'approved — OTP: ')}${testOtp}`, { duration: 5000 });
      load();
    } catch (err) { toast.error(err.response?.data?.message || t('resident.failedApprove', 'Failed to approve')); }
    finally { setActing(a => ({...a, [id]:null})); }
  };

  const deny = async (id, name) => {
    setActing(a => ({...a, [id]:'denying'}));
    try {
      await visitorsAPI.deny(id);
      toast.success(`${name} ${t('resident.denied', 'denied')}`);
      load();
    } catch { toast.error(t('resident.failedDeny', 'Failed to deny')); }
    finally { setActing(a => ({...a, [id]:null})); }
  };

  if (loading) return (
    <div style={{ textAlign:'center', padding:48 }}>
      <div className="spinner" style={{ margin:'0 auto' }}/>
    </div>
  );

  if (pending.length === 0) return (
    <div className="card fade-in" style={{ textAlign:'center', padding:'52px 20px', color:'var(--tx3)' }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="var(--bdr2)" strokeWidth="2" style={{ marginBottom:16 }}>
        <polyline points="8,26 20,38 44,14"/>
      </svg>
      <div style={{ fontWeight:500, fontSize:16, color:'var(--tx2)' }}>{t('resident.allClear', 'All clear')}</div>
      <div style={{ fontSize:13, marginTop:6 }}>{t('resident.noPending', 'No pending visitor approvals right now')}</div>
      <button className="btn btn-ghost btn-sm" style={{ marginTop:16 }} onClick={load}>{t('resident.refresh', 'Refresh')}</button>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:13, color:'var(--tx2)' }}>{pending.length} {pending.length>1? t('resident.visitorsSpace', ' visitors ') : t('resident.visitorSpace', ' visitor ')} {t('resident.waiting', 'waiting')}</div>
        <button className="btn btn-ghost btn-sm" onClick={load}>{t('resident.refresh', 'Refresh')}</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {pending.map(v => {
          const meta = PURPOSE_META[v.purpose] || PURPOSE_META.other;
          const isActing = !!acting[v._id];
          return (
            <div key={v._id} style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:'var(--r2)', padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:13, marginBottom:12 }}>
                <div className="avatar" style={{ width:40, height:40, background:meta.bg, color:meta.color, fontSize:13 }}>
                  {v.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--tx)' }}>{v.name}</div>
                  <div style={{ fontSize:12, color:'var(--tx2)', marginTop:3 }}>
                    {t('resident.purposeLabel', 'Purpose:')} <span style={{ textTransform:'capitalize' }}>{t(`admin.${meta.label.toLowerCase()}`, meta.label.toLowerCase())}</span>
                    {v.phone && <> · <span style={{ fontFamily:'var(--mono)' }}>{v.phone}</span></>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--tx3)', marginTop:2 }}>
                    {t('resident.flatSpace', 'Flat ')}{v.flatNumber} · {new Date(v.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
                <span className="badge badge-amber">{t('resident.pending', 'Pending')}</span>
              </div>

              {v.isSuspicious && (
                <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', background:'var(--red-lt)', border:'1px solid #fca5a5', borderRadius:8, marginBottom:12, fontSize:12, color:'#b91c1c' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M6.5 1.5L12 11H1L6.5 1.5zM6.5 5v2.5m0 1.5v.5"/>
                  </svg>
                  {t('resident.flaggedSuspicious', 'Flagged as suspicious:')} {v.suspicionReason || t('resident.multipleDenials', 'Multiple prior denials')}
                </div>
              )}

              <div style={{ fontSize:12, color:'var(--tx3)', background:'var(--bg3)', padding:'8px 12px', borderRadius:8, marginBottom:12, lineHeight:1.5 }}>
                {t('resident.approvingWillSend', "Approving will send a one-time OTP to the visitor's phone. Valid for 30 minutes.")}
              </div>

              <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
                <button className="btn btn-success" disabled={isActing} onClick={()=>approve(v._id, v.name)}>
                  {acting[v._id]==='approving' ? t('resident.approving', 'Approving...') : t('resident.approveSendOtp', 'Approve & send OTP')}
                </button>
                <button className="btn btn-danger" disabled={isActing} onClick={()=>deny(v._id, v.name)}>
                  {acting[v._id]==='denying' ? t('resident.denying', 'Denying...') : t('resident.denyEntry', 'Deny entry')}
                </button>
                <a href={`tel:${v.phone}`} className="btn btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('resident.callVisitor', 'Call visitor')}</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
