import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";
import { getActiveWorkspace } from "../utils/workspace";
import { hasRole } from "../utils/helpers";

/**
 * RoleProtectedRoute — redirects to /dashboard if the user's workspace role
 * does not meet minRole. Reads role synchronously from localStorage.
 *
 * @param {string} minRole  'ADMIN' | 'MANAGER' | 'MEMBER'
 */
export default function RoleProtectedRoute({ children, minRole }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const ws = getActiveWorkspace();
  if (!ws || !hasRole(ws.role, minRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
