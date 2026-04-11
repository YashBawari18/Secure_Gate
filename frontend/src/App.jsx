import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Layout             from './components/Layout';
import Login              from './pages/Login';
import AdminDashboard     from './pages/AdminDashboard';
import Analytics          from './pages/Analytics';
import Alerts             from './pages/Alerts';
import VisitorLog         from './pages/VisitorLog';
import SuspiciousActivity from './pages/SuspiciousActivity';
import FaceVerify         from './pages/FaceVerify';
import Residents          from './pages/Residents';
import Passes             from './pages/Passes';
import Watchlist          from './pages/Watchlist';
import GuardEntry         from './pages/GuardEntry';
import QRScanner          from './pages/QRScanner';
import ResidentApprovals  from './pages/ResidentApprovals';
import ResidentInvite     from './pages/ResidentInvite';
import Notifications      from './pages/Notifications';
import TrustScore         from './pages/TrustScore';

import './index.css';

/* ── Preloader Component ── */
function GlobalPreloader() {
  const { loading: authLoading } = useAuth();
  const [routing, setRouting] = useState(false);
  const [fade, setFade] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Whenever location changes, trigger loader
    setRouting(true);
    setFade(false);
    
    // Hold it solid for 400ms, then fade it out
    const holdTimer = setTimeout(() => {
      setFade(true);
    }, 400);
    
    const unmountTimer = setTimeout(() => {
      setRouting(false);
    }, 700);

    return () => { clearTimeout(holdTimer); clearTimeout(unmountTimer); };
  }, [location.pathname]);

  const isLoading = authLoading || routing;

  if (!isLoading && !fade) return null; // completely unmounted
  // If fade is true, we keep it mounted until opacity transition finishes (700ms total)
  if (!isLoading && fade && !routing) return null; // Edge case catch

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999, background: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: (authLoading || (!fade && routing)) ? 1 : 0, 
      transition: 'opacity 0.3s ease-out', pointerEvents: 'none'
    }}>
      <style>
        {`
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
      <div style={{ marginTop: 24, fontSize: 16, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.02em' }}>
        Loading SecureGate...
      </div>
    </div>
  );
}

/* ── Route guard ── */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  // Use a simpler native CSS loader here so it doesn't conflict with global preloader
  if (loading) return null; 

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={`/${user.role}`} replace />;
  return children;
}

/* ── Shorthand wrapper ── */
const P = ({ roles, children }) => (
  <ProtectedRoute allowedRoles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

/* ── Routes ── */
function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <GlobalPreloader />
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
        <Route path="/"      element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />

        {/* Admin */}
        <Route path="/admin"            element={<P roles={['admin']}><AdminDashboard /></P>} />
        <Route path="/admin/analytics"  element={<P roles={['admin']}><Analytics /></P>} />
        <Route path="/admin/alerts"     element={<P roles={['admin']}><Alerts /></P>} />
        <Route path="/admin/log"        element={<P roles={['admin']}><VisitorLog /></P>} />
        <Route path="/admin/suspicious" element={<P roles={['admin']}><SuspiciousActivity /></P>} />
        <Route path="/admin/facecheck"  element={<P roles={['admin']}><FaceVerify /></P>} />
        <Route path="/admin/residents"  element={<P roles={['admin']}><Residents /></P>} />
        <Route path="/admin/passes"     element={<P roles={['admin']}><Passes /></P>} />
        <Route path="/admin/watchlist"  element={<P roles={['admin']}><Watchlist /></P>} />

        {/* Guard */}
        <Route path="/guard"        element={<P roles={['guard']}><GuardEntry /></P>} />
        <Route path="/guard/log"    element={<P roles={['guard']}><VisitorLog /></P>} />
        <Route path="/guard/alerts" element={<P roles={['guard']}><Alerts /></P>} />
        <Route path="/guard/scan"   element={<P roles={['guard']}><QRScanner /></P>} />
        <Route path="/guard/facecheck" element={<P roles={['guard']}><FaceVerify /></P>} />

        {/* Resident */}
        <Route path="/resident"                   element={<P roles={['resident']}><ResidentApprovals /></P>} />
        <Route path="/resident/invite"            element={<P roles={['resident']}><ResidentInvite /></P>} />
        <Route path="/resident/history"           element={<P roles={['resident']}><VisitorLog /></P>} />
        <Route path="/resident/notifications"     element={<P roles={['resident']}><Notifications /></P>} />
        <Route path="/resident/trust"             element={<P roles={['resident']}><TrustScore /></P>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right"
          toastOptions={{ style: { fontFamily: 'var(--font)', fontSize: 13, borderRadius: 10 } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
