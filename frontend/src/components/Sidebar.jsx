import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Squares2X2Icon,
  FolderIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { getUser, logout } from "../utils/auth";
import { getActiveWorkspace } from "../utils/workspace";
import { hasRole } from "../utils/helpers";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: Squares2X2Icon },
  { to: "/projects", label: "Projects", Icon: FolderIcon },
  { to: "/members", label: "Members", Icon: UsersIcon, minRole: "MANAGER" },
  { to: "/settings", label: "Settings", Icon: Cog6ToothIcon, minRole: "ADMIN" },
];

/**
 * Sidebar component.
 * Props:
 *  - open    : boolean — controls mobile overlay visibility
 *  - onClose : fn      — called when user closes sidebar on mobile
 */
export default function Sidebar({ open = false, onClose }) {
  const user = getUser();
  const workspace = getActiveWorkspace();
  const userRole = workspace?.role || "MEMBER";

  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.minRole || hasRole(userRole, item.minRole),
  );

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const CollapseIcon = collapsed ? ChevronRightIcon : ChevronLeftIcon;

  return (
    <aside
      className={`sidebar ${collapsed ? "sidebar--collapsed" : "sidebar--expanded"} ${open ? "sidebar--mobile-open" : ""}`}
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="sidebar__header">
        {!collapsed && (
          <div className="sidebar__brand">
            <span className="sidebar__brand-icon">📋</span>
            <span className="sidebar__brand-name">PlanBoard</span>
          </div>
        )}
        <button
          id="sidebar-toggle"
          className="sidebar__toggle"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <CollapseIcon className="sidebar__toggle-icon" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="sidebar__nav">
        {visibleItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="sidebar__link-icon" />
            {!collapsed && <span className="sidebar__link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__spacer" />

      {/* User section */}
      <div className="sidebar__user">
        <div
          className={`sidebar__user-info ${collapsed ? "sidebar__user-info--centered" : ""}`}
        >
          <div className="sidebar__avatar" title={user?.name}>
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="sidebar__user-text">
              <p className="sidebar__user-name">{user?.name}</p>
              <p className="sidebar__user-role">{userRole}</p>
            </div>
          )}
        </div>
        <button
          id="sidebar-logout"
          className={`sidebar__logout ${collapsed ? "sidebar__logout--icon-only" : ""}`}
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
        >
          <ArrowLeftStartOnRectangleIcon className="sidebar__logout-icon" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
