import api from './axiosInstance';

export const getComments   = (taskId)          => api.get(`/api/tasks/${taskId}/comments`);
export const createComment = (taskId, data)     => api.post(`/api/tasks/${taskId}/comments`, data);
export const deleteComment = (commentId)        => api.delete(`/api/comments/${commentId}`);
