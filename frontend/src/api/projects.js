import api from "./axiosInstance";

export const getProjects = (workspaceId) =>
  api.get(`/api/workspaces/${workspaceId}/projects`);

export const createProject = (workspaceId, data) =>
  api.post(`/api/workspaces/${workspaceId}/projects`, data);

export const updateProject = (projectId, data) =>
  api.patch(`/api/projects/${projectId}`, data);

export const deleteProject = (projectId) =>
  api.delete(`/api/projects/${projectId}`);
