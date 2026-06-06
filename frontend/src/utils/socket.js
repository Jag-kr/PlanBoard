import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

/**
 * Get (or lazily create) the Socket.IO client instance.
 * Authenticates using the JWT token stored in localStorage.
 */
export const getSocket = () => {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('planboard_token');
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
};

/**
 * Join a workspace room to receive real-time task/comment updates.
 */
export const joinWorkspace = (workspaceId) => {
  const s = getSocket();
  s.emit('join:workspace', workspaceId);
};

/**
 * Leave a workspace room.
 */
export const leaveWorkspace = (workspaceId) => {
  if (socket) socket.emit('leave:workspace', workspaceId);
};

/**
 * Disconnect and clear the socket instance (call on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
