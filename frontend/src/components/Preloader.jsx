import React from 'react';

export default function Preloader({ show }) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fade-out 0.3s ease-out forwards',
      animationDelay: '0.5s', // stays solid for 500ms then fades
    }}>
      <style>
        {`
          @keyframes fade-out {
            0% { opacity: 1; visibility: visible; }
            100% { opacity: 0; visibility: hidden; }
          }
          @keyframes pulse-logo {
            0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(79, 70, 229, 0.2); }
            50% { transform: scale(1.1); box-shadow: 0 0 40px rgba(236, 72, 153, 0.4); }
          }
          .preloader-box {
            width: 72px; height: 72px;
            background: linear-gradient(135deg, #4f46e5, #ec4899);
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            animation: pulse-logo 1.5s ease-in-out infinite;
          }
        `}
      </style>
      <div className="preloader-box">
        <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
          <path d="M10 1.5L17 5.5v9L10 18.5 3 14.5v-9L10 1.5z" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round"/>
          <circle cx="10" cy="10" r="3" fill="#fff"/>
        </svg>
      </div>
      <div style={{ marginTop: 24, fontSize: 16, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #1e3a8a, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Authenticating SecureGate...
      </div>
    </div>
  );
}
