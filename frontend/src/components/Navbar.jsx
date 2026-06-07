import { useState, useRef, useEffect } from "react";
import {
  Bars3Icon,
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  getWorkspaces,
  getActiveWorkspace,
  switchWorkspace,
  createWorkspace,
} from "../utils/workspace";
import Modal from "./Modal";
import { toastError } from "../utils/toast";

/**
 * Top bar — hamburger menu (mobile), workspace switcher + create workspace modal.
 */
export default function Navbar({ onMenuToggle }) {
  const [workspaces] = useState(() => getWorkspaces());
  const [activeWorkspace] = useState(() => getActiveWorkspace());

  const [wsDropOpen, setWsDropOpen] = useState(false);
  const [newWsModal, setNewWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [creating, setCreating] = useState(false);

  const wsRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wsRef.current && !wsRef.current.contains(e.target))
        setWsDropOpen(false);
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
      window.location.href = "/dashboard";
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to create workspace.");
      setCreating(false);
    }
  };

  return (
    <>
      <header className="topbar">
        {/* Hamburger — mobile only */}
        <button
          id="sidebar-hamburger"
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <div ref={wsRef} className="topbar__workspace">
          <button
            id="workspace-switcher"
            onClick={() => setWsDropOpen((v) => !v)}
            className="topbar__ws-btn"
          >
            <span className="topbar__ws-dot">
              {(activeWorkspace?.name || "?")[0].toUpperCase()}
            </span>
            <span className="topbar__ws-name">
              {activeWorkspace?.name || "No workspace"}
            </span>
            <ChevronDownIcon className="topbar__ws-chevron" />
          </button>

          {wsDropOpen && (
            <div className="topbar__ws-dropdown">
              <div className="topbar__ws-dropdown-label">Your Workspaces</div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    if (ws.id !== activeWorkspace?.id) switchWorkspace(ws);
                    else setWsDropOpen(false);
                  }}
                  className={`topbar__ws-item ${ws.id === activeWorkspace?.id ? "topbar__ws-item--active" : ""}`}
                >
                  <span className="topbar__ws-item-dot">
                    {ws.name[0].toUpperCase()}
                  </span>
                  <span className="topbar__ws-item-name">{ws.name}</span>
                  {ws.id === activeWorkspace?.id && (
                    <CheckIcon className="topbar__ws-check" />
                  )}
                </button>
              ))}
              <div className="topbar__ws-divider" />
              <button
                onClick={() => {
                  setWsDropOpen(false);
                  setNewWsModal(true);
                }}
                className="topbar__ws-create"
              >
                <PlusIcon className="h-4 w-4" />
                New workspace
              </button>
            </div>
          )}
        </div>
      </header>

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
