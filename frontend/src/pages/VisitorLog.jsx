import React, { useEffect, useState, useCallback } from 'react';
import { visitorsAPI } from '../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const STATUS_COLOR = { approved:'green', pending:'amber', denied:'red', flagged:'red', exited:'gray' };
const METHOD_COLOR = { otp:'blue', qr:'green', manual:'gray' };

export default function VisitorLog() {
  const [visitors, setVisitors] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [purpose,  setPurpose]  = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const { t } = useTranslation();
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await visitorsAPI.getAll({ search, status, purpose, page, limit: LIMIT });
      setVisitors(r.data.visitors);
      setTotal(r.data.total);
    } catch { toast.error(t('visitorLog.failLoad', 'Failed to load visitor log')); }
    finally { setLoading(false); }
  }, [search, status, purpose, page]);

  useEffect(() => { load(); }, [load]);

  const handleExit = async (id) => {
    try { await visitorsAPI.exit(id); toast.success(t('visitorLog.exitRecorded', 'Exit recorded')); load(); }
    catch { toast.error(t('visitorLog.failRecordExit', 'Failed to record exit')); }
  };

  const handleWatch = async (id) => {
    try { await visitorsAPI.watchlist(id); toast.success(t('visitorLog.addedWatchlist', 'Added to watchlist')); load(); }
    catch { toast.error(t('alerts.fail', 'Failed')); }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—';

  return (
    <div className="fade-in">
      {/* Filter bar */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8, background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:8, padding:'7px 12px' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--tx3)" strokeWidth="1.3">
            <circle cx="5.5" cy="5.5" r="4.5"/><line x1="9" y1="9" x2="12.5" y2="12.5"/>
          </svg>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
            placeholder={t('visitorLog.search', 'Search name, flat, phone...')}
            style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'var(--tx)', flex:1 }}/>
        </div>
        <select className="form-input" style={{ width:150 }} value={status}
          onChange={e=>{ setStatus(e.target.value); setPage(1); }}>
          <option value="">{t('visitorLog.allStatuses', 'All statuses')}</option>
          <option value="pending">{t('admin.status.pending', 'Pending')}</option>
          <option value="approved">{t('admin.status.approved', 'Approved')}</option>
          <option value="denied">{t('admin.status.denied', 'Denied')}</option>
          <option value="flagged">{t('admin.status.flagged', 'Flagged')}</option>
          <option value="exited">{t('admin.status.exited', 'Exited')}</option>
        </select>
        <select className="form-input" style={{ width:150 }} value={purpose}
          onChange={e=>{ setPurpose(e.target.value); setPage(1); }}>
          <option value="">{t('visitorLog.allPurposes', 'All purposes')}</option>
          <option value="guest">{t('admin.guest', 'Guest')}</option>
          <option value="delivery">{t('admin.delivery', 'Delivery')}</option>
          <option value="maintenance">{t('admin.maintenance', 'Maintenance')}</option>
          <option value="cab">{t('admin.cab', 'Cab')}</option>
          <option value="other">{t('admin.other', 'Other')}</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>{t('alerts.refresh', 'Refresh')}</button>
      </div>

      {/* Table */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:'var(--r2)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:44, textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }}/></div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>{t('visitorLog.visitor', 'Visitor')}</th><th>{t('admin.flat', 'Flat')}</th><th>{t('visitorLog.purpose', 'Purpose')}</th><th>{t('visitorLog.entry', 'Entry')}</th><th>{t('visitorLog.exit', 'Exit')}</th><th>{t('visitorLog.method', 'Method')}</th><th>{t('visitorLog.status', 'Status')}</th><th>{t('visitorLog.actions', 'Actions')}</th></tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--tx3)', padding:32 }}>{t('visitorLog.noVisitors', 'No visitors found')}</td></tr>
                ) : visitors.map(v => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ fontWeight:500 }}>{v.name}</div>
                      <div style={{ fontSize:10, color:'var(--tx3)', fontFamily:'var(--mono)' }}>{v.phone}</div>
                      {v.isSuspicious && <span className="badge badge-red" style={{ marginTop:3, fontSize:9 }}>{t('visitorLog.suspicious', 'Suspicious')}</span>}
                    </td>
                    <td style={{ fontFamily:'var(--mono)', fontWeight:500 }}>{v.flatNumber||'—'}</td>
                    <td style={{ textTransform:'capitalize', color:'var(--tx2)' }}>{t(`admin.${v.purpose}`, v.purpose)}</td>
                    <td style={{ fontFamily:'var(--mono)', fontSize:12 }}>{fmt(v.entryTime)}</td>
                    <td style={{ fontFamily:'var(--mono)', fontSize:12 }}>{fmt(v.exitTime)}</td>
                    <td><span className={`badge badge-${METHOD_COLOR[v.entryMethod]||'gray'}`} style={{ textTransform:'uppercase', fontSize:9 }}>{t(`admin.method.${v.entryMethod}`, v.entryMethod)}</span></td>
                    <td><span className={`badge badge-${STATUS_COLOR[v.status]||'gray'}`} style={{ textTransform:'capitalize' }}>{t(`admin.status.${v.status}`, v.status)}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {v.status === 'approved' && !v.exitTime && (
                          <button className="btn btn-ghost btn-sm" onClick={()=>handleExit(v._id)}>{t('visitorLog.exitBtn', 'Exit')}</button>
                        )}
                        {!v.isWatchlisted && (v.isSuspicious || v.status==='denied' || v.flagCount>0) && (
                          <button className="btn btn-danger btn-sm" onClick={()=>handleWatch(v._id)}>{t('visitorLog.watchBtn', 'Watch')}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, fontSize:12, color:'var(--tx3)' }}>
          <span>{t('visitorLog.showing', 'Showing')} {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} {t('visitorLog.of', 'of')} {total}</span>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-ghost btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>{t('visitorLog.prev', 'Prev')}</button>
            <button className="btn btn-ghost btn-sm" disabled={page*LIMIT>=total} onClick={()=>setPage(p=>p+1)}>{t('visitorLog.next', 'Next')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
