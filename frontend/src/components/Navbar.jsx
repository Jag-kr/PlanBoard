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
 * Top bar — hamburger (mobile), workspace switcher, create-workspace modal.
 * All styling via inline Tailwind utilities — no custom CSS classes.
 */
export default function Navbar({ onMenuToggle }) {
  const [workspaces] = useState(() => getWorkspaces());
  const [activeWorkspace] = useState(() => getActiveWorkspace());

  const [wsDropOpen, setWsDropOpen] = useState(false);
  const [newWsModal, setNewWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [creating, setCreating] = useState(false);

  const wsRef = useRef(null);

  // Close dropdown on outside click
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
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 sm:px-4">
        {/* Hamburger — mobile only */}
        <button
          id="sidebar-hamburger"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* ── Workspace switcher ──────────────────────────────────── */}
        <div ref={wsRef} className="relative">
          <button
            id="workspace-switcher"
            onClick={() => setWsDropOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors max-w-[160px] sm:max-w-[220px]"
          >
            {/* Workspace initial dot */}
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">
              {(activeWorkspace?.name || "?")[0].toUpperCase()}
            </span>
            <span className="truncate">
              {activeWorkspace?.name || "No workspace"}
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          </button>

          {/* Dropdown */}
          {wsDropOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Your Workspaces
              </p>

              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    if (ws.id !== activeWorkspace?.id) switchWorkspace(ws);
                    else setWsDropOpen(false);
                  }}
                  className={[
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50",
                    ws.id === activeWorkspace?.id
                      ? "font-medium text-blue-600"
                      : "text-gray-700",
                  ].join(" ")}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-600">
                    {ws.name[0].toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{ws.name}</span>
                  {ws.id === activeWorkspace?.id && (
                    <CheckIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-blue-600" />
                  )}
                </button>
              ))}

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={() => {
                  setWsDropOpen(false);
                  setNewWsModal(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                New workspace
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Create workspace modal ──────────────────────────────── */}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setNewWsModal(false)}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newWsName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
