const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Initialize Socket.IO with authentication middleware and workspace room management.
 * @param {import('socket.io').Server} io
 */
module.exports = function initSockets(io) {
  // JWT auth middleware for every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Unauthorized: No token provided.'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Unauthorized: Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user?.email || socket.id}`);

    /**
     * Client joins a workspace room to receive real-time updates.
     * Event: 'join:workspace', payload: workspaceId (string)
     */
    socket.on('join:workspace', (workspaceId) => {
      if (typeof workspaceId === 'string' && workspaceId.trim()) {
        socket.join(`workspace:${workspaceId}`);
        console.log(`[Socket] ${socket.user?.email} joined workspace:${workspaceId}`);
      }
    });

    /**
     * Client leaves a workspace room.
     * Event: 'leave:workspace', payload: workspaceId (string)
     */
    socket.on('leave:workspace', (workspaceId) => {
      if (typeof workspaceId === 'string' && workspaceId.trim()) {
        socket.leave(`workspace:${workspaceId}`);
        console.log(`[Socket] ${socket.user?.email} left workspace:${workspaceId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${socket.user?.email || socket.id} (${reason})`);
    });
  });
};
