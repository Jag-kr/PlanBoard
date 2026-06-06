import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useWorkspace } from './context/WorkspaceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

import Login      from './pages/Login';
import Signup     from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard  from './pages/Dashboard';
import Projects   from './pages/Projects';
import Board      from './pages/Board';
import Members    from './pages/Members';
import Settings   from './pages/Settings';

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  const { activeWorkspace, loading } = useWorkspace();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!activeWorkspace) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Semi-public (auth required but no workspace needed) */}
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />

        {/* Protected app routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppShell><Dashboard /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <AppShell><Projects /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <AppShell><Board /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/members" element={
          <ProtectedRoute>
            <AppShell><Members /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppShell><Settings /></AppShell>
          </ProtectedRoute>
        } />

        {/* Default */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
