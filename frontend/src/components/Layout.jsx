import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import toast from 'react-hot-toast';

/* ── Inline SVG icon ── */
const Ico = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 15 15" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV = (t) => ({
  admin: [
    {
      section: t('section.overview'),
      items: [
        { label: t('nav.dashboard'),  path: '/admin',            icon: 'M1 1h5v5H1zm8 0h5v5h-5zM1 9h5v5H1zm8 0h5v5h-5z' },
        { label: t('nav.analytics'),  path: '/admin/analytics',  icon: 'M1 13L5 7l3 2 5-6' },
      ],
    },
    {
      section: t('section.security'),
      items: [
        { label: t('nav.alerts'),      path: '/admin/alerts',     icon: 'M7.5 1L13.5 12H1.5L7.5 1zM7.5 5v3m0 2v.5', badge: 'alerts' },
        { label: t('nav.visitorLog'),  path: '/admin/log',        icon: 'M2 1h11v13H2zM4 5h7M4 7.5h7M4 10h4' },
        { label: t('nav.suspicious'),  path: '/admin/suspicious', icon: 'M7.5 1a6.5 6.5 0 100 13zm0-8v3.5m0 2v.5' },
        { label: t('nav.faceVerify'),  path: '/admin/facecheck',  icon: 'M7.5 5a2.5 2.5 0 100 5zM1 13.5c0-2.5 3-4.5 6.5-4.5s6.5 2 6.5 4.5', isNew: true },
      ],
    },
    {
      section: t('section.manage'),
      items: [
        { label: t('nav.residents'),  path: '/admin/residents', icon: 'M1 14V7.5L7.5 2 14 7.5V14M5 10h5v4H5z' },
        { label: t('nav.passes'),     path: '/admin/passes',    icon: 'M1 5h13v7H1zm0 2.5h13' },
        { label: t('nav.watchlist'),  path: '/admin/watchlist', icon: 'M7.5 1a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 0a6.5 6.5 0 010 13M7.5 5v.5m0 4v.5', isNew: true },
      ],
    },
  ],
  guard: [
    {
      section: t('section.gateOps'),
      items: [
        { label: t('nav.entryCheck'),    path: '/guard',           icon: 'M2 1h8l1 1v2l2 2v8H2zM10 4l2 2M5 8h5M5 10.5h3' },
        { label: t('nav.todayLog'),      path: '/guard/log',       icon: 'M2 1h11v13H2zM4 5h7M4 7.5h7M4 10h4' },
        { label: t('nav.alerts'),        path: '/guard/alerts',    icon: 'M7.5 1L13.5 12H1.5L7.5 1zM7.5 5v3m0 2v.5', badge: 'alerts' },
        { label: t('nav.qrScanner'),     path: '/guard/scan',      icon: 'M1 1h5v5H1zm8 0h5v5h-5zM1 9h5v5H1zm8 0h2v2m2-2v2m-2 2h2m0-4h2' },
        { label: t('nav.faceVerify'),    path: '/guard/facecheck', icon: 'M7.5 5a2.5 2.5 0 100 5zM1 13.5c0-2.5 3-4.5 6.5-4.5s6.5 2 6.5 4.5', isNew: true },
      ],
    },
  ],
  resident: [
    {
      section: t('section.myApartment'),
      items: [
        { label: t('nav.approvals'),      path: '/resident',                 icon: 'M2 8l4 4 7-7', badge: 'approvals' },
        { label: t('nav.inviteVisitor'),  path: '/resident/invite',          icon: 'M7.5 5a2.5 2.5 0 100 5zM1 13.5c0-2.5 3-4.5 6.5-4.5s6.5 2 6.5 4.5' },
        { label: t('nav.visitHistory'),   path: '/resident/history',         icon: 'M7.5 1a6.5 6.5 0 100 13zm0-9v3.5l2.5 1.5' },
        { label: t('nav.notifications'),  path: '/resident/notifications',   icon: 'M7.5 1.5a5 5 0 015 5v3l1.5 2.5H1L2.5 9.5v-3a5 5 0 015-5zM6 13a1.5 1.5 0 003 0', badge: 'notifs' },
        { label: t('nav.trustScores'),    path: '/resident/trust',           icon: 'M7.5 1l2 4.5 5 .5-3.5 3.5 1 5L7.5 12 3 14.5l1-5L.5 6l5-.5z', isNew: true },
      ],
    },
  ],
});

const PAGE_TITLES = {
  '/admin': 'Security dashboard', '/admin/analytics': 'Visitor analytics',
  '/admin/alerts': 'Security alerts', '/admin/log': 'Visitor log',
  '/admin/suspicious': 'Suspicious activity', '/admin/facecheck': 'Face verification',
  '/admin/residents': 'Resident directory', '/admin/passes': 'Active passes',
  '/admin/watchlist': 'Visitor watchlist',
  '/guard': 'Entry verification', '/guard/log': "Today's log",
  '/guard/alerts': 'Security alerts', '/guard/scan': 'QR scanner',
  '/guard/facecheck': 'Face verification',
  '/resident': 'Pending approvals', '/resident/invite': 'Invite visitor',
  '/resident/history': 'Visit history', '/resident/notifications': 'Notifications',
  '/resident/trust': 'Trust scores',
};

export default function Layout({ children, alertCount = 0, approvalCount = 0 }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const LANGS = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  ];

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('sg_lang', code);
    setShowLangMenu(false);
  };

  const currentLang = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  if (!user) return null;

  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const navGroups = NAV(t)[user.role] || [];
  const pageTitle = PAGE_TITLES[location.pathname] || 'SecureGate';

  const getBadgeCount = (key) => {
    if (key === 'alerts' && alertCount > 0)     return alertCount;
    if (key === 'approvals' && approvalCount > 0) return approvalCount;
    return null;
  };

  const roleAccent = user.role === 'admin' ? 'var(--pri)' : user.role === 'guard' ? 'var(--grn)' : 'var(--amb)';
  const roleBg     = user.role === 'admin' ? 'var(--pri-lt)' : user.role === 'guard' ? 'var(--grn-lt)' : 'var(--amb-lt)';

  // Flatten items for mobile bottom nav
  const flatItems = navGroups.flatMap(g => g.items);

  return (
    <div className="app-shell">

      {/* ── Sidebar (Desktop & Tablet) ── */}
      <div className="sidebar desktop-only">
        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-logo">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5v7L8 15 2 11.5v-7L8 1z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2.5" fill="#fff"/>
            </svg>
          </div>
          <div>
            <div className="sb-name">SecureGate</div>
            <div className="sb-sub">v3.0 · Residential</div>
          </div>
        </div>

        {/* User context */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(226,232,240,0.6)' }} className="desktop-only">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg3)', borderRadius: '12px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '10px', background: roleBg, color: roleAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx3)', textTransform: 'capitalize', marginTop: 2 }}>
                {user.role}{user.flatNumber ? ` · Flat ${user.flatNumber}` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {navGroups.map(group => (
            <div key={group.section} style={{ marginBottom: 16 }}>
              <div className="desktop-only" style={{ fontSize: 11, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 14px 8px', fontWeight: 600 }}>
                {group.section}
              </div>
              {group.items.map(item => {
                const active = location.pathname === item.path;
                const badge  = item.badge ? getBadgeCount(item.badge) : null;
                return (
                  <div key={item.path}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                    title={item.label}
                  >
                    <Ico d={item.icon} size={18} />
                    <span>{item.label}</span>
                    {item.isNew && <span className="badge" style={{ background: 'var(--pri)', color: '#fff', marginLeft: 'auto', fontSize: 9 }}>NEW</span>}
                    {badge != null && <span className="badge" style={{ background: 'var(--red)', color: '#fff', marginLeft: 'auto', fontSize: 11 }}>{badge}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(226,232,240,0.6)' }}>
          <div className="nav-item" style={{ color: 'var(--red)' }} onClick={() => { logout(); toast.success('Signed out safely'); navigate('/login'); }}>
            <Ico d="M5.5 1.5H2a1 1 0 00-1 1v10a1 1 0 001 1h3.5m2-10l3.5 4-3.5 4m3.5-4H5.5" size={18} />
            <span>Sign out</span>
          </div>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="main-area">

        {/* Topbar */}
        <div className="topbar">
          <div style={{ flex: 1, fontSize: 18, fontWeight: 700, color: 'var(--tx)' }}>{pageTitle}</div>
          
          {alertCount > 0 && (
            <div onClick={() => navigate(`/${user.role}/alerts`)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--red-lt)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, fontSize: 13, color: 'var(--red)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.15)', whiteSpace: 'nowrap' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', animation:'fadeIn 1s infinite alternate' }} />
              {alertCount} alert{alertCount > 1 ? 's' : ''}
            </div>
          )}

          {/* Language Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--tx2)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🌐 {currentLang.flag}
            </button>
            {showLangMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden', minWidth: 150 }}>
                {LANGS.map(l => (
                  <div key={l.code}
                    onClick={() => changeLang(l.code)}
                    style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: i18n.language === l.code ? 'var(--pri)' : 'var(--tx2)', fontWeight: i18n.language === l.code ? 700 : 500, background: i18n.language === l.code ? 'var(--pri-lt)' : 'transparent' }}
                  >
                    {l.flag} {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* User pill for mobile/topbar */}
          <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
             <div onClick={() => { logout(); toast.success('Signed out'); navigate('/login'); }} style={{ fontSize: 24, cursor: 'pointer' }}>👋</div>
          </div>
          
          <div className="user-avatar desktop-only">
            {initials}
          </div>
        </div>

        {/* Page content */}
        <div className="page-content fade-in">
          <div className="page-title mobile-only">{pageTitle}</div>
          {children}
        </div>
      </div>

      {/* ── Bottom Nav (Mobile Only) ── */}
      <div className="bottom-nav mobile-only">
        {flatItems.map((item) => {
          const active = location.pathname === item.path;
          const badge = item.badge ? getBadgeCount(item.badge) : null;
          return (
            <div key={item.path} className={`bn-item ${active ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              <div style={{ position: 'relative' }}>
                <Ico d={item.icon} size={22} />
                {badge != null && <span className="bn-badge">{badge}</span>}
              </div>
              <span style={{ fontSize: 10 }}>{item.label}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
