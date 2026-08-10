const { Server } = require('socket.io');

let io;

const initSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Driver or User joins a specific route room
    socket.on('join_route', (routeId) => {
      socket.join(routeId);
      console.log(`Socket ${socket.id} joined route room: ${routeId}`);
    });

    socket.on('leave_route', (routeId) => {
      socket.leave(routeId);
      console.log(`Socket ${socket.id} left route room: ${routeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSockets, getIo };
