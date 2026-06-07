import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { hasRole } from "../utils/helpers";
import LoadingSpinner from "./LoadingSpinner";

/**
 * RoleProtectedRoute — wraps a route and redirects to /dashboard if
 * the current user's workspace role does not meet minRole.
 *
 * @param {string} minRole  - 'ADMIN' | 'MANAGER' | 'MEMBER'
 */
export default function RoleProtectedRoute({ children, minRole }) {
  const { isAuthenticated } = useAuth();
  const { activeWorkspace, loading } = useWorkspace();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const userRole = activeWorkspace?.role;

  if (!userRole || !hasRole(userRole, minRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
