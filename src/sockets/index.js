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
    socket.on('join_route', async (routeId) => {
      if (!routeId) return;
      socket.join(routeId);

      try {
        const { getLiveBusLocation } = require('../controllers/trackingController');
        const cached = getLiveBusLocation(routeId);

        if (cached && cached.location) {
          socket.emit('bus_location_update', {
            routeId,
            location: cached.location,
            speed: cached.speed,
            status: cached.status,
            lastPingAt: cached.lastPingAt,
          });
        } else {
          // Fallback to database if no cache yet
          const BusRoute = require('../models/BusRoute');
          const route = await BusRoute.findOne({ routeId }).select('currentLocation currentSpeed trackingStatus lastPingAt');
          if (route && route.currentLocation?.lat && route.currentLocation?.lng) {
            socket.emit('bus_location_update', {
              routeId,
              location: route.currentLocation,
              speed: route.currentSpeed || 0,
              status: route.trackingStatus || 'scheduled',
              lastPingAt: route.lastPingAt,
            });
          }
        }
      } catch (err) {
        console.error(`[join_route initial sync error for ${routeId}]:`, err.message);
      }
    });

    socket.on('leave_route', (routeId) => {
      if (routeId) socket.leave(routeId);
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
