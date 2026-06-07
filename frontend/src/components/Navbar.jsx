import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import Avatar from "./Avatar";
import Modal from "./Modal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace } =
    useWorkspace();
  const navigate = useNavigate();

  const [wsDropOpen, setWsDropOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [newWsModal, setNewWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [creating, setCreating] = useState(false);

  const wsRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wsRef.current && !wsRef.current.contains(e.target))
        setWsDropOpen(false);
      if (userRef.current && !userRef.current.contains(e.target))
        setUserDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreating(true);
    try {
      await createWorkspace(newWsName.trim());
      setNewWsModal(false);
      setNewWsName("");
      navigate("/dashboard");
    } catch {
      // handled by interceptor
    } finally {
      setCreating(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-600"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4 sticky top-0 z-30">
        {/* Logo + workspace switcher */}
        <div className="flex items-center gap-3 mr-4">
          <span className="text-xl">📋</span>
          <span className="font-bold text-gray-900 text-base hidden sm:block">
            PlanBoard
          </span>

          {/* Workspace dropdown */}
          <div ref={wsRef} className="relative">
            <button
              id="workspace-switcher"
              onClick={() => setWsDropOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors max-w-[180px] truncate"
            >
              <span className="truncate">
                {activeWorkspace?.name || "No workspace"}
              </span>
              <svg
                className="h-3.5 w-3.5 flex-shrink-0 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {wsDropOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Your Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws);
                      setWsDropOpen(false);
                      navigate("/dashboard");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                      ws.id === activeWorkspace?.id
                        ? "text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="h-5 w-5 rounded bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {ws.name[0].toUpperCase()}
                    </span>
                    <span className="truncate">{ws.name}</span>
                    {ws.id === activeWorkspace?.id && (
                      <svg
                        className="ml-auto h-3.5 w-3.5 text-blue-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setWsDropOpen(false);
                      setNewWsModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                  >
                    <span className="text-base">＋</span> New workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={navLinkClass}>
            Projects
          </NavLink>
          <NavLink to="/members" className={navLinkClass}>
            Members
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            Settings
          </NavLink>
        </div>

        {/* User avatar dropdown */}
        <div ref={userRef} className="relative">
          <button
            id="user-menu"
            onClick={() => setUserDropOpen((v) => !v)}
            className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
          >
            <Avatar name={user?.name} size="sm" />
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
              {user?.name}
            </span>
          </button>

          {userDropOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setUserDropOpen(false);
                  logout();
                  navigate("/login");
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Create workspace modal */}
      <Modal
        isOpen={newWsModal}
        onClose={() => setNewWsModal(false)}
        title="Create new workspace"
        size="sm"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace name
            </label>
            <input
              autoFocus
              type="text"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="e.g. Acme Engineering"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setNewWsModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newWsName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
