const BusRoute = require('../models/BusRoute');
const { getIo } = require('../sockets');
const response = require('@responses');
const { simulateBus, stopBusSimulation } = require('../scripts/simulateBus');

// In-Memory Live Tracking State Cache: routeId -> { location, speed, status, lastPingAt, lastDbSyncAt }
const liveTrackingCache = new Map();
const DB_SYNC_INTERVAL_MS = 30000; // Sync to MongoDB every 30 seconds per bus route

const getLiveBusLocation = (routeId) => {
  return liveTrackingCache.get(routeId) || null;
};

const updateLocation = async (req, res) => {
  try {
    const { routeId, lat, lng, speed, status } = req.body;

    if (!routeId || lat == null || lng == null) {
      return response.badReq(res, { message: 'routeId, lat, and lng are required' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    const numSpeed = Number(speed) || 0;
    const now = new Date();

    const prevCache = liveTrackingCache.get(routeId) || {};
    const updatedState = {
      routeId,
      location: { lat: numLat, lng: numLng },
      speed: numSpeed,
      status: status || prevCache.status || 'in-transit',
      lastPingAt: now,
      lastDbSyncAt: prevCache.lastDbSyncAt || 0,
    };

    // 1. Update in-memory cache immediately (RAM speed: ~0.001ms)
    liveTrackingCache.set(routeId, updatedState);

    // 2. Broadcast immediately over Socket.io to connected room listeners
    try {
      const io = getIo();
      if (io) {
        io.to(routeId).emit('bus_location_update', {
          routeId,
          location: updatedState.location,
          speed: updatedState.speed,
          status: updatedState.status,
          lastPingAt: updatedState.lastPingAt,
        });
      }
    } catch (sockErr) {
      console.error('[Socket Broadcast Error]:', sockErr.message);
    }

    // 3. Throttled / Debounced DB Persistence: only write to MongoDB every 30s or on status change
    const isStatusChanged = status && status !== prevCache.status;
    const isTimeToSyncDb = (now.getTime() - updatedState.lastDbSyncAt) >= DB_SYNC_INTERVAL_MS;

    if (isStatusChanged || isTimeToSyncDb || !prevCache.lastDbSyncAt) {
      updatedState.lastDbSyncAt = now.getTime();
      liveTrackingCache.set(routeId, updatedState);

      // Async DB write in background without blocking API response
      BusRoute.updateOne(
        { routeId },
        {
          $set: {
            currentLocation: updatedState.location,
            currentSpeed: updatedState.speed,
            trackingStatus: updatedState.status,
            lastPingAt: updatedState.lastPingAt,
          },
        }
      ).catch((dbErr) => console.error(`[DB Sync Error for ${routeId}]:`, dbErr.message));
    }

    return response.ok(res, {
      message: 'Location updated successfully',
      data: updatedState.location,
    });
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
      const now = new Date();
      liveTrackingCache.delete(routeId);

      await BusRoute.updateOne(
        { routeId },
        {
          $set: {
            trackingStatus: 'scheduled',
            currentSpeed: 0,
            lastPingAt: now,
          },
        }
      );

      try {
        const io = getIo();
        if (io) {
          io.to(routeId).emit('bus_location_update', {
            routeId,
            location: route.currentLocation,
            speed: 0,
            status: 'scheduled',
            lastPingAt: now,
          });
        }
      } catch (sockErr) {
        console.error('[Socket Broadcast Error on Stop]:', sockErr.message);
      }

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
  getLiveBusLocation,
};
