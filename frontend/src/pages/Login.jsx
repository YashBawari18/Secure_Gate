import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',   flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी',  flag: '🟠' },
];

function LangSwitcher({ dark = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 20,
          border: dark ? '1px solid rgba(255,255,255,0.25)' : '1px solid #e2e8f0',
          background: dark ? 'rgba(255,255,255,0.12)' : '#fff',
          color: dark ? '#fff' : '#374151',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          letterSpacing: '-0.01em',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
        {current.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="2,3.5 5,6.5 8,3.5"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden', zIndex: 9999, minWidth: 130,
        }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', border: 'none', background:
                  l.code === i18n.language ? '#eff4ff' : '#fff',
                color: l.code === i18n.language ? '#2563eb' : '#374151',
                fontSize: 13, fontWeight: l.code === i18n.language ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <span style={{ fontSize: 16 }}>{l.flag}</span>
              {l.label}
              {l.code === i18n.language && (
                <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#2563eb" strokeWidth="2">
                  <polyline points="2,6 5,9 10,3"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ROLES = [
  {
    role: 'admin',
    label: 'Admin',
    email: 'admin@securegate.com',
    password: 'admin123',
    color: '#2563eb',
    bg: '#eff4ff',
    desc: 'Full platform access, analytics, user management',
    iconD: 'M7.5 1a6.5 6.5 0 100 13zm3.5-4.5a3.5 3.5 0 01-7 0',
  },
  {
    role: 'guard',
    label: 'Guard',
    email: 'guard@securegate.com',
    password: 'guard123',
    color: '#16a34a',
    bg: '#f0fdf4',
    desc: 'Entry verification, OTP/QR scanning, gate log',
    iconD: 'M7.5 1L14 4.5v7L7.5 14 1 11.5v-7zm0 0v13M1 4.5l6.5 3 6.5-3',
  },
  {
    role: 'resident',
    label: 'Resident',
    email: 'resident@securegate.com',
    password: 'resident123',
    color: '#d97706',
    bg: '#fffbeb',
    desc: 'Approve visitors, invite guests, view history',
    iconD: 'M1 14V7.5L7.5 2 14 7.5V14M5 10h5v4H5z',
  },
];

// features array moved inside component or mapped dynamically

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);

  const displayFeatures = [
    t('login.feat1', 'OTP & QR-based verified entry'),
    t('login.feat2', 'Real-time resident notifications'),
    t('login.feat3', 'Suspicious activity auto-detection'),
    t('login.feat4', 'AI face verification (new)'),
    t('login.feat5', 'Visitor trust scoring system'),
    t('login.feat6', 'Cross-gate watchlist & alerts')
  ];

  const fillRole = (r) => {
    setEmail(r.email);
    setPassword(r.password);
    setSelected(r.role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`${t('login.welcome', 'Welcome')}, ${user.name.split(' ')[0]}!`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed — check credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      {/* ── Left panel ── */}
      <div className="login-left fade-in">
        <div>
          {/* Logo + lang switcher row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M10 1.5L17 5.5v9L10 18.5 3 14.5v-9L10 1.5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="3" fill="#fff"/>
                </svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.02em' }}>SecureGate</div>
                <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 500, marginTop: 2 }}>Resident Platform v3.0</div>
              </div>
            </div>
            <LangSwitcher dark />
          </div>

          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.03em' }}>
            {t('login.leftTitle', 'Secure, verified entry for your community.')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 16, lineHeight: 1.6, marginBottom: 40, fontWeight: 400 }}>
            {t('login.leftDesc', 'Real-time approvals, automatic AI face checks, and advanced threat detection—all beautifully designed.')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {displayFeatures.map((f, i) => (
              <div key={i} className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,.9)', fontSize: 14, fontWeight: 500, animationDelay: `${i * 0.1}s` }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 10 10">
                    <polyline points="2,5 4,7 8,3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 500 }}>&copy; 2026 SecureGate. All rights reserved.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right">
        <div className="login-card fade-in">

          {/* Language switcher top-right of card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <LangSwitcher />
          </div>

          <h2 className="login-title">{t('login.rightTitle', 'Sign in to your dashboard')}</h2>
          <p style={{ color: 'var(--tx3)', fontSize: 14, marginBottom: 32, textAlign: 'center', fontWeight: 500 }}>{t('login.rightDesc', 'Choose a demo role below or use your custom login.')}</p>

          {/* Role selector cards */}
          <div className="roles-grid">
            {ROLES.map(r => (
              <button key={r.role} type="button" onClick={() => fillRole(r)}
                style={{ background: selected === r.role ? r.bg : 'var(--bg3)', border: `2px solid ${selected === r.role ? r.color : 'transparent'}`, borderRadius: 14, padding: '16px 12px', cursor: 'pointer', textAlign: 'center', transition: 'all .25s ease', outline: 'none', boxShadow: selected === r.role ? `0 4px 12px ${r.color}30` : 'none' }}>
                <div style={{ width: 36, height: 36, background: selected === r.role ? r.color : 'var(--bg2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', transition: 'all 0.2s ease', color: selected === r.role ? '#fff' : r.color, boxShadow: 'var(--shadow-sm)' }}>
                  <svg width="18" height="18" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={r.iconD}/>
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', marginBottom: 2 }}>
                  {t('login.roles.' + r.role, r.label)}
                </div>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">{t('login.email', 'Email Address')}</label>
              <input className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="name@domain.com" autoComplete="email" />
            </div>

            <div className="form-group" style={{ position: 'relative', marginBottom: 28 }}>
              <label className="form-label">{t('login.password', 'Password')}</label>
              <input className="form-input" type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                autoComplete="current-password" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 12, top: 32, background: 'none', border: 'none', color: 'var(--tx3)', padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPass 
                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></> 
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn btn-pri btn-full" style={{ fontSize: 15 }}>
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />{t('login.loading', 'Authorizing...')}</>
                : t('login.submit', 'Secure Sign In')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
