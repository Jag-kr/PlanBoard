let _io;

/**
 * Store the Socket.IO server instance.
 * Called once in server.js after creating the io instance.
 * @param {import('socket.io').Server} io
 */
exports.setIo = (io) => {
  _io = io;
};

/**
 * Retrieve the Socket.IO server instance.
 * @returns {import('socket.io').Server}
 */
exports.getIo = () => _io;

/**
 * Emit an event to all sockets in a workspace room.
 * @param {string} workspaceId
 * @param {string} event
 * @param {*} data
 */
exports.emitToWorkspace = (workspaceId, event, data) => {
  if (_io) {
    _io.to(`workspace:${workspaceId}`).emit(event, data);
  }
};
