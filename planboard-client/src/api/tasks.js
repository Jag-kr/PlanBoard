import api from './axiosInstance';

export const getTasks    = (projectId, params) => api.get(`/api/projects/${projectId}/tasks`, { params });
export const createTask  = (projectId, data)   => api.post(`/api/projects/${projectId}/tasks`, data);
export const updateTask  = (taskId, data)      => api.patch(`/api/tasks/${taskId}`, data);
export const deleteTask  = (taskId)            => api.delete(`/api/tasks/${taskId}`);
