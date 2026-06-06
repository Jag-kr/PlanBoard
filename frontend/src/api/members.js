import api from './axiosInstance';

export const getMembers       = (workspaceId)             => api.get(`/api/workspaces/${workspaceId}/members`);
export const inviteMember     = (workspaceId, data)       => api.post(`/api/workspaces/${workspaceId}/invite`, data);
export const acceptInvitation = (token)                   => api.post(`/api/invitations/${token}/accept`);
export const updateMemberRole = (workspaceId, userId, data) => api.patch(`/api/workspaces/${workspaceId}/members/${userId}`, data);
export const removeMember     = (workspaceId, userId)     => api.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
