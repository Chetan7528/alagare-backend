const BusRoute = require('../models/BusRoute');
const { getIo } = require('../sockets');
const response = require('@responses');

const updateLocation = async (req, res) => {
  try {
    const { routeId, lat, lng, speed, status } = req.body;

    if (!routeId || !lat || !lng) {
      return response.badReq(res, { message: 'routeId, lat, and lng are required' });
    }

    const route = await BusRoute.findOne({ routeId });
    if (!route) {
      return response.notFound(res, { message: 'BusRoute not found' });
    }

    // Update route model
    route.currentLocation = { lat, lng };
    route.currentSpeed = speed || route.currentSpeed;
    if (status) route.trackingStatus = status;
    route.lastPingAt = new Date();
    await route.save();

    // Broadcast to tracking clients via Socket.io
    const io = getIo();
    io.to(routeId).emit('bus_location_update', {
      routeId,
      location: route.currentLocation,
      speed: route.currentSpeed,
      status: route.trackingStatus,
      lastPingAt: route.lastPingAt,
    });

    return response.ok(res, { message: 'Location updated successfully', data: route.currentLocation });
  } catch (error) {
    return response.error(res, error);
  }
};

module.exports = {
  updateLocation,
};
