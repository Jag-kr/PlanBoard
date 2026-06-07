import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "./utils/auth";
import { getActiveWorkspace, fetchAndCacheWorkspaces } from "./utils/workspace";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LoadingSpinner from "./components/LoadingSpinner";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Members from "./pages/Members";
import Settings from "./pages/Settings";

/**
 * AppShell — fetches & caches workspaces on mount, then renders
 * the sidebar + topbar + page content layout.
 * Also manages mobile sidebar open/close state.
 */
function AppShell({ children }) {
  const [loading, setLoading] = useState(!getActiveWorkspace());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Re-fetch workspaces to keep localStorage fresh on every mount
    fetchAndCacheWorkspaces().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-shell__main">
        <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}

function RootRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!getActiveWorkspace()) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Auth required, no workspace needed */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected app routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <AppShell>
                <Projects />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <Tasks />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute minRole="MANAGER">
                <AppShell>
                  <Members />
                </AppShell>
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute minRole="ADMIN">
                <AppShell>
                  <Settings />
                </AppShell>
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
