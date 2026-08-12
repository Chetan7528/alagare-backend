const BusRoute = require('../models/BusRoute');
const { getIo } = require('../sockets');
const response = require('@responses');
const { simulateBus, stopBusSimulation } = require('../scripts/simulateBus');

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

const startSimulation = async (req, res) => {
  try {
    const { routeId, durationSeconds } = req.body;
    if (!routeId) return response.badReq(res, { message: 'routeId is required' });
    
    const route = await BusRoute.findOne({ routeId });
    if (!route) return response.notFound(res, { message: 'BusRoute not found' });
    
    // Using default hardcoded coordinates for simulation (Lucknow to Kanpur)
    // In a real scenario, this would come from the route geometry
    const startLat = 26.8467;
    const startLng = 80.9462;
    const endLat = 26.4499;
    const endLng = 80.3319;

    // Fire and forget (runs asynchronously)
    simulateBus(routeId, startLat, startLng, endLat, endLng, durationSeconds || 300);

    return response.ok(res, { message: 'Simulation started for ' + routeId });
  } catch (error) {
    return response.error(res, error);
  }
};

const stopSimulation = async (req, res) => {
  try {
    const { routeId } = req.body;
    if (!routeId) return response.badReq(res, { message: 'routeId is required' });

    const route = await BusRoute.findOne({ routeId });
    if (!route) return response.notFound(res, { message: 'BusRoute not found' });

    const stopped = stopBusSimulation(routeId);
    
    // Also broadcast a status update to clients that the bus has stopped tracking
    if (stopped) {
      route.trackingStatus = 'scheduled';
      await route.save();
      
      const io = getIo();
      io.to(routeId).emit('bus_location_update', {
        routeId,
        location: route.currentLocation,
        speed: 0,
        status: 'scheduled',
        lastPingAt: new Date(),
      });
      return response.ok(res, { message: 'Simulation stopped for ' + routeId });
    } else {
      return response.ok(res, { message: 'No active simulation found for ' + routeId });
    }
  } catch (error) {
    return response.error(res, error);
  }
};

module.exports = {
  updateLocation,
  startSimulation,
  stopSimulation,
};
