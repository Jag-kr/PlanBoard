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

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export default function Sidebar({ open = false, onClose }) {
  const user = getUser();
  const workspace = getActiveWorkspace();
  const userRole = workspace?.role || "MEMBER";

  // Desktop-only collapse state (mobile always expanded)
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.minRole || hasRole(userRole, item.minRole),
  );

  return (
    <aside
      className={[
        // Shared
        "flex flex-col shrink-0 h-full bg-white border-r border-gray-200",
        "transition-all duration-300 ease-in-out",
        // Mobile positioning (overridden by lg:* below)
        "fixed inset-y-0 left-0 z-50 w-64",
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        // Desktop: back to normal flow, width driven by collapsed state
        "lg:static lg:shadow-none",
        open ? "lg:translate-x-0" : "lg:translate-x-0", // always visible on desktop
        collapsed ? "lg:w-16" : "lg:w-56",
      ].join(" ")}
      aria-label="Main navigation"
    >
      {/* ── Brand / header ─────────────────────────────────────── */}
      <div
        className={[
          "flex items-center border-b border-gray-100 shrink-0 min-h-[3.5rem]",
          collapsed ? "justify-center px-3" : "justify-between px-3",
        ].join(" ")}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xl shrink-0">📋</span>
            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
              PlanBoard
            </span>
          </div>
        )}

        {/* Desktop collapse toggle — hidden on mobile */}
        <button
          id="sidebar-toggle"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1">
        {visibleItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose} // close sidebar on mobile when navigating
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              [
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                // Width-dependent spacing
                collapsed
                  ? "justify-center px-2 py-2.5 mx-1"
                  : "gap-3 px-2.5 py-2.5",
                // Active vs default state
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <span className="whitespace-nowrap overflow-hidden">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User section ────────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-2 py-3 space-y-1 shrink-0">
        {/* Avatar + name/role */}
        <div
          className={[
            "flex items-center gap-2.5 px-2 py-1.5",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <div
            className="h-7 w-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-default select-none"
            title={user?.name}
          >
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-tight">
                {userRole}
              </p>
            </div>
          )}
        </div>

        {/* Sign-out button */}
        <button
          id="sidebar-logout"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className={[
            "flex items-center gap-2 w-full rounded-lg text-xs font-medium",
            "text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors",
            collapsed ? "justify-center px-2 py-2 mx-1 w-auto" : "px-2.5 py-2",
          ].join(" ")}
        >
          <ArrowLeftStartOnRectangleIcon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
