import { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

const TOKEN_KEY = 'planboard_token';
const USER_KEY  = 'planboard_user';

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);

  const persistAuth = useCallback((tokenVal, userVal) => {
    localStorage.setItem(TOKEN_KEY, tokenVal);
    localStorage.setItem(USER_KEY, JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    persistAuth(res.data.token, res.data.user);
    return res.data;
  }, [persistAuth]);

  const signup = useCallback(async (name, email, password) => {
    const res = await authApi.signup({ name, email, password });
    persistAuth(res.data.token, res.data.user);
    return res.data;
  }, [persistAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('planboard_workspace');
    disconnectSocket();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
