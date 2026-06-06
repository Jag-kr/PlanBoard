import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as workspacesApi from '../api/workspaces';
import { joinWorkspace, leaveWorkspace } from '../utils/socket';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

const WS_KEY = 'planboard_workspace';

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces]           = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading]                 = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await workspacesApi.getMyWorkspaces();
      const list = res.data.workspaces || [];
      setWorkspaces(list);

      // Restore last-used workspace
      const savedId = localStorage.getItem(WS_KEY);
      const found   = list.find((w) => w.id === savedId) || list[0] || null;
      if (found) {
        setActiveWorkspace(found);
        localStorage.setItem(WS_KEY, found.id);
        joinWorkspace(found.id);
      }
    } catch (err) {
      console.error('[WorkspaceContext] fetchWorkspaces error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount / auth change
  useEffect(() => {
    if (isAuthenticated) fetchWorkspaces();
    else {
      setWorkspaces([]);
      setActiveWorkspace(null);
    }
  }, [isAuthenticated, fetchWorkspaces]);

  const switchWorkspace = useCallback((workspace) => {
    if (activeWorkspace?.id) leaveWorkspace(activeWorkspace.id);
    setActiveWorkspace(workspace);
    localStorage.setItem(WS_KEY, workspace.id);
    joinWorkspace(workspace.id);
  }, [activeWorkspace]);

  const createWorkspace = useCallback(async (name) => {
    const res = await workspacesApi.createWorkspace({ name });
    const newWs = res.data.workspace;
    setWorkspaces((prev) => [newWs, ...prev]);
    switchWorkspace({ ...newWs, role: 'ADMIN', memberCount: 1 });
    return newWs;
  }, [switchWorkspace]);

  const updateActiveWorkspace = useCallback((updates) => {
    setActiveWorkspace((prev) => prev ? { ...prev, ...updates } : prev);
    setWorkspaces((prev) => prev.map((w) => w.id === updates.id ? { ...w, ...updates } : w));
  }, []);

  const refreshWorkspaces = fetchWorkspaces;

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      loading,
      switchWorkspace,
      createWorkspace,
      refreshWorkspaces,
      updateActiveWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};
