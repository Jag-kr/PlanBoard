import api from "../api/axiosInstance";

const TOKEN_KEY = "planboard_token";
const USER_KEY = "planboard_user";

// ── Read helpers ────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!getToken();

// ── Write / clear ───────────────────────────────────────────────────────────

const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("planboard_workspace");
  localStorage.removeItem("planboard_workspaces");
  localStorage.removeItem("planboard_ws_id");
};

// ── Actions ─────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  const res = await api.post("/api/auth/login", { email, password });
  saveAuth(res.data.token, res.data.user);
  return res.data;
};

export const signup = async (name, email, password) => {
  const res = await api.post("/api/auth/signup", { name, email, password });
  saveAuth(res.data.token, res.data.user);
  return res.data;
};

export const logout = () => {
  clearAuth();
  window.location.href = "/login";
};
