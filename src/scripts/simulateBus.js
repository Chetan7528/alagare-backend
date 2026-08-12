require('module-alias/register');
const axios = require('axios');

const API_URL = 'http://localhost:3008/api/v1/buses/tracking/location'; // Base URL
const API_KEY = '6a5099b7c2119ed087473ed5.9b76827791cb73a8ea72066cbca4e6ee1095de0e2a9110d78872ba98b3a0a9e3'; // Admin bootstrap API key

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function getPointAlongRoute(routePoints, targetDistance) {
  if (targetDistance <= 0) return routePoints[0];
  let traveled = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const p1 = routePoints[i];
    const p2 = routePoints[i+1];
    const segmentLength = getDistanceFromLatLonInMeters(p1.lat, p1.lng, p2.lat, p2.lng);
    if (traveled + segmentLength >= targetDistance) {
      const ratio = segmentLength === 0 ? 0 : (targetDistance - traveled) / segmentLength;
      return {
        lat: p1.lat + (p2.lat - p1.lat) * ratio,
        lng: p1.lng + (p2.lng - p1.lng) * ratio
      };
    }
    traveled += segmentLength;
  }
  return routePoints[routePoints.length - 1]; // Reached the end
}

const activeSimulations = {};

const getOSRMRoute = async (startLat, startLng, endLat, endLng) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'AlagareBusTracker/1.0 (contact@alagare.com)'
      }
    });
    const coordinates = res.data.routes[0].geometry.coordinates; // [lng, lat]
    return coordinates.map(c => ({ lat: c[1], lng: c[0] }));
  } catch (error) {
    console.error("OSRM Error:", error.message);
    return [];
  }
};

const simulateBus = async (routeId, startLat, startLng, endLat, endLng, durationSeconds = 300) => {
  console.log(`Starting simulation for Route: ${routeId}`);
  
  if (activeSimulations[routeId]) {
    console.log(`Stopping previous simulation for Route: ${routeId}`);
    clearInterval(activeSimulations[routeId]);
    delete activeSimulations[routeId];
  }

  const routePoints = await getOSRMRoute(startLat, startLng, endLat, endLng);
  
  // Fallback to straight line if OSRM fails
  if (!routePoints.length) {
    console.log("OSRM Failed. Falling back to straight line simulation.");
    routePoints.push({ lat: startLat, lng: startLng });
    routePoints.push({ lat: endLat, lng: endLng });
  }

  // Calculate total route distance
  let totalRouteDistance = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    totalRouteDistance += getDistanceFromLatLonInMeters(routePoints[i].lat, routePoints[i].lng, routePoints[i+1].lat, routePoints[i+1].lng);
  }

  // To make simulation faster for testing without losing realism, we simulate a speed of 120 km/h 
  // (33.3 meters per second). In 5 seconds, it moves ~166 meters.
  // 120 km/h is fast enough for testing but slow enough to track on map.
  const simSpeedKmh = 120; 
  const metersPerPing = (simSpeedKmh * 1000 / 3600) * 5; 
  let currentDistance = 0;

  let stepCount = 0;

  const pingInterval = setInterval(async () => {
    stepCount++;
    currentDistance += metersPerPing;
    
    // Find exact physical location on the polyline
    const currentPoint = getPointAlongRoute(routePoints, currentDistance);
    const currentLat = currentPoint.lat;
    const currentLng = currentPoint.lng;

    const hasArrived = currentDistance >= totalRouteDistance;
    const status = hasArrived ? 'arrived' : 'in-transit';
    
    // Display realistic dummy speed
    const speed = simSpeedKmh - 5 + Math.floor(Math.random() * 10); 

    try {
      await axios.post(API_URL, {
        routeId,
        lat: currentLat,
        lng: currentLng,
        speed,
        status,
      }, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      console.log(`[${routeId}] Pinged location: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)} | Speed: ${speed} km/h | Status: ${status}`);
    } catch (error) {
      console.error(`[${routeId}] Ping failed:`, error.response?.data || error.message);
    }

    if (hasArrived) {
      console.log(`Simulation finished for Route: ${routeId}`);
      clearInterval(activeSimulations[routeId]);
      delete activeSimulations[routeId];
    }
  }, 5000);
  
  activeSimulations[routeId] = pingInterval;
};

const stopBusSimulation = (routeId) => {
  if (activeSimulations[routeId]) {
    console.log(`Manually stopping simulation for Route: ${routeId}`);
    clearInterval(activeSimulations[routeId]);
    delete activeSimulations[routeId];
    return true;
  }
  return false;
};

// Example usage if ran directly: node src/scripts/simulateBus.js <routeId> <startLat> <startLng> <endLat> <endLng>
if (require.main === module) {
  const [,, routeId, startLat, startLng, endLat, endLng] = process.argv;
  if (!routeId || !startLat || !startLng || !endLat || !endLng) {
    console.log("Usage: node simulateBus.js <routeId> <startLat> <startLng> <endLat> <endLng>");
    process.exit(1);
  }
  
  simulateBus(routeId, parseFloat(startLat), parseFloat(startLng), parseFloat(endLat), parseFloat(endLng));
}

module.exports = { simulateBus, stopBusSimulation };
