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

function LangSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.6)',
          background: 'rgba(255,255,255,0.7)',
          color: '#1e293b',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          letterSpacing: '-0.01em',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        {current.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="2,3.5 5,6.5 8,3.5"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0',
          borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden', zIndex: 9999, minWidth: 140,
          backdropFilter: 'blur(20px)'
        }}>
          {LANGS.map(l => (
            <button
              type="button"
              key={l.code}
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', border: 'none', background:
                  l.code === i18n.language ? '#eff4ff' : 'transparent',
                color: l.code === i18n.language ? '#2563eb' : '#374151',
                fontSize: 14, fontWeight: l.code === i18n.language ? 600 : 500,
                cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid rgba(0,0,0,0.03)',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              {l.label}
              {l.code === i18n.language && (
                <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#2563eb" strokeWidth="2.5">
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

const CSS3DModel = () => (
  <div style={{ width: 400, height: 400, position: 'relative', margin: '40px auto 0', perspective: 1200 }}>
    <style>
      {`
        @keyframes spin3d {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(720deg) rotateZ(360deg); }
        }
        @keyframes pulseCore {
          0%, 100% { transform: scale(1) translateZ(0); box-shadow: 0 0 60px #4f46e5, inset 0 0 30px #ec4899; }
          50% { transform: scale(1.15) translateZ(0); box-shadow: 0 0 100px #3b82f6, inset 0 0 50px #8b5cf6; }
        }
        .sh-ring {
          position: absolute; inset: 0; margin: auto;
          border-radius: 50%;
          border: 12px solid rgba(255,255,255,0.4);
          box-shadow: 0 0 30px rgba(79, 70, 229, 0.3), inset 0 0 20px rgba(79, 70, 229, 0.4);
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transform-style: preserve-3d;
        }
        .sh-core {
          position: absolute; inset: 0; margin: auto;
          width: 120px; height: 120px;
          background: linear-gradient(135deg, #4f46e5, #ec4899, #3b82f6);
          background-size: 200% 200%;
          border-radius: 50%;
          animation: pulseCore 4s ease-in-out infinite;
        }
      `}
    </style>
    <div style={{ position: 'absolute', width: '100%', height: '100%', transformStyle: 'preserve-3d', animation: 'spin3d 25s linear infinite' }}>
      <div className="sh-ring" style={{ width: 340, height: 340, transform: 'rotateX(45deg) rotateY(45deg)' }} />
      <div className="sh-ring" style={{ width: 260, height: 260, transform: 'rotateX(-45deg) rotateY(-45deg)' }} />
      <div className="sh-ring" style={{ width: 180, height: 180, transform: 'rotateY(90deg) rotateZ(45deg)' }} />
      <div className="sh-core" style={{ filter: 'drop-shadow(0 20px 40px rgba(79,70,229,0.5))' }} />
    </div>
  </div>
);

const ROLES = [
  {
    role: 'admin',
    label: 'Admin',
    email: 'admin@securegate.com',
    password: 'admin123',
    color: '#3b82f6',
    bg: '#eff6ff',
    iconD: 'M7.5 1a6.5 6.5 0 100 13zm3.5-4.5a3.5 3.5 0 01-7 0',
  },
  {
    role: 'guard',
    label: 'Guard',
    email: 'guard@securegate.com',
    password: 'guard123',
    color: '#10b981',
    bg: '#ecfdf5',
    iconD: 'M7.5 1L14 4.5v7L7.5 14 1 11.5v-7zm0 0v13M1 4.5l6.5 3 6.5-3',
  },
  {
    role: 'resident',
    label: 'Resident',
    email: 'resident@securegate.com',
    password: 'resident123',
    color: '#f59e0b',
    bg: '#fffbeb',
    iconD: 'M1 14V7.5L7.5 2 14 7.5V14M5 10h5v4H5z',
  },
];

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);

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
    <div className="hero-wrapper fade-in">
      {/* Animated Orbs */}
      <div className="orb o1"></div>
      <div className="orb o2"></div>

      {/* Top right language switcher */}
      <div style={{ position: 'absolute', top: 24, right: 32, zIndex: 100 }}>
        <LangSwitcher />
      </div>

      <div style={{ 
        zIndex: 10, display: 'flex', flexWrap: 'wrap', width: '100%', 
        maxWidth: 1300, padding: '40px 24px', gap: 60, alignItems: 'center', justifyContent: 'center' 
      }}>
        
        {/* LEFT COLUMN: SECURITY MARKETING */}
        <div style={{ flex: '1 1 500px', maxWidth: 640 }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #4f46e5, #ec4899)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(236, 72, 153, 0.25)' }}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <path d="M10 1.5L17 5.5v9L10 18.5 3 14.5v-9L10 1.5z" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="3" fill="#fff"/>
              </svg>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.03em' }}>SecureGate v3</div>
          </div>

          <h1 className="hero-title" style={{ textAlign: 'left', fontSize: 56, marginBottom: 24, lineHeight: 1.1 }}>
            {t('login.leftTitle', 'Next-Gen Community Security.')}
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: 18, lineHeight: 1.6, marginBottom: 40, fontWeight: 500 }}>
            {t('login.leftDesc', 'Real-time approvals, automatic AI face checks, and advanced threat detection—all wrapped in a beautifully fast interface.')}
          </p>

          <CSS3DModel />
        </div>

        {/* RIGHT COLUMN: LOGIN PORTAL */}
        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <div className="glass-portal fade-in" style={{ width: '100%', margin: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.02em', marginBottom: 8 }}>{t('login.rightTitle', 'Platform Sign In')}</h2>
              <p style={{ color: 'var(--tx3)', fontSize: 14, fontWeight: 500 }}>{t('login.rightDesc', 'Select your demo role to access the portal')}</p>
            </div>

            {/* Roles */}
            <div className="roles-grid" style={{ marginBottom: 32 }}>
              {ROLES.map(r => (
                <button key={r.role} type="button" onClick={() => fillRole(r)}
                  style={{ 
                    background: selected === r.role ? r.color : 'rgba(255,255,255,0.7)', 
                    border: `1px solid ${selected === r.role ? r.color : 'rgba(255,255,255,0.8)'}`, 
                    borderRadius: 16, padding: '14px 8px', cursor: 'pointer', textAlign: 'center', 
                    transition: 'all .3s cubic-bezier(0.16,1,0.3,1)', outline: 'none', 
                    boxShadow: selected === r.role ? `0 8px 20px ${r.color}50` : '0 2px 8px rgba(0,0,0,0.02)',
                    transform: selected === r.role ? 'translateY(-4px)' : 'none'
                  }}>
                  <div style={{ width: 32, height: 32, background: selected === r.role ? 'rgba(255,255,255,0.2)' : r.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: selected === r.role ? '#fff' : r.color }}>
                    <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={r.iconD}/></svg>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: selected === r.role ? '#fff' : 'var(--tx2)' }}>
                    {t('login.roles.' + r.role, r.label)}
                  </div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ color: 'var(--tx2)' }}>{t('login.email', 'Email Address')}</label>
                <input className="form-input" style={{ background: 'rgba(255,255,255,0.8)' }} type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="name@domain.com" autoComplete="email" />
              </div>

              <div className="form-group" style={{ position: 'relative', marginBottom: 32 }}>
                <label className="form-label" style={{ color: 'var(--tx2)' }}>{t('login.password', 'Password')}</label>
                <input className="form-input" style={{ background: 'rgba(255,255,255,0.8)', paddingRight: 44 }} type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 12, top: 32, background: 'none', border: 'none', color: 'var(--tx3)', padding: 6, cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPass 
                      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></> 
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn" style={{ 
                width: '100%', padding: 16, fontSize: 16, fontWeight: 700, 
                background: 'linear-gradient(135deg, #4f46e5, #9333ea)', color: '#fff', 
                borderRadius: 16, boxShadow: '0 8px 24px rgba(147, 51, 234, 0.3)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />{t('login.loading', 'Authorizing...')}</> : t('login.submit', 'Access SecureGate')}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
