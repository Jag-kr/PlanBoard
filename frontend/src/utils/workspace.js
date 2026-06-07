import api from "../api/axiosInstance";

const WS_ACTIVE_KEY = "planboard_workspace"; // stores full workspace object as JSON
const WS_LIST_KEY = "planboard_workspaces"; // stores full list as JSON
const WS_ID_KEY = "planboard_ws_id"; // stores last-used id string

// ── Read helpers ────────────────────────────────────────────────────────────

export const getActiveWorkspace = () => {
  try {
    return JSON.parse(localStorage.getItem(WS_ACTIVE_KEY)) || null;
  } catch {
    return null;
  }
};

export const getWorkspaces = () => {
  try {
    return JSON.parse(localStorage.getItem(WS_LIST_KEY)) || [];
  } catch {
    return [];
  }
};

const saveWorkspaces = (list) =>
  localStorage.setItem(WS_LIST_KEY, JSON.stringify(list));

const saveActive = (ws) => {
  localStorage.setItem(WS_ACTIVE_KEY, JSON.stringify(ws));
  if (ws?.id) localStorage.setItem(WS_ID_KEY, ws.id);
};

// ── Fetch & cache from API ──────────────────────────────────────────────────

/**
 * Fetch workspaces from the server, cache them, and resolve the active one.
 * Safe to call on every AppShell mount — keeps localStorage fresh.
 */
export const fetchAndCacheWorkspaces = async () => {
  const res = await api.get("/api/workspaces/mine");
  const list = res.data.workspaces || [];
  saveWorkspaces(list);

  const savedId = localStorage.getItem(WS_ID_KEY);
  const active = list.find((w) => w.id === savedId) || list[0] || null;
  if (active) saveActive(active);

  return { list, active };
};

// ── Actions ─────────────────────────────────────────────────────────────────

/**
 * Switch to a different workspace.
 * Uses a full-page redirect so every component re-reads localStorage fresh.
 */
export const switchWorkspace = (ws) => {
  saveActive(ws);
  window.location.href = "/dashboard";
};

/**
 * Create a new workspace, cache it, then redirect to dashboard.
 */
export const createWorkspace = async (name) => {
  const res = await api.post("/api/workspaces", { name });
  const newWs = { ...res.data.workspace, role: "ADMIN", memberCount: 1 };
  const list = [newWs, ...getWorkspaces()];
  saveWorkspaces(list);
  saveActive(newWs);
  return newWs;
};

/**
 * Patch the active workspace object in localStorage (after a name update, etc.)
 */
export const updateCachedWorkspace = (updates) => {
  const current = getActiveWorkspace();
  if (!current) return;
  const updated = { ...current, ...updates };
  saveActive(updated);
  const list = getWorkspaces().map((w) => (w.id === updated.id ? updated : w));
  saveWorkspaces(list);
};
