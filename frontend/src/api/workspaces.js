import api from "./axiosInstance";

export const createWorkspace = (data) => api.post("/api/workspaces", data);

export const getMyWorkspaces = () => api.get("/api/workspaces/mine");

export const updateWorkspace = (id, data) =>
  api.patch(`/api/workspaces/${id}`, data);

export const getWorkspaceStats = (id) => api.get(`/api/workspaces/${id}/stats`);
