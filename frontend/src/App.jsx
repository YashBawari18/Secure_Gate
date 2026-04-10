import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

/* ── Route guard ── */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  );
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
