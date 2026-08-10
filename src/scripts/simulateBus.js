require('module-alias/register');
const axios = require('axios');

const API_URL = 'http://localhost:3008/api/v1/buses/tracking/location'; // Base URL
const API_KEY = '6a5099b7c2119ed087473ed5.9b76827791cb73a8ea72066cbca4e6ee1095de0e2a9110d78872ba98b3a0a9e3'; // Admin bootstrap API key

const simulateBus = async (routeId, startLat, startLng, endLat, endLng, durationSeconds = 300) => {
  console.log(`Starting simulation for Route: ${routeId}`);
  
  const steps = durationSeconds / 5; // Ping every 5 seconds
  const latStep = (endLat - startLat) / steps;
  const lngStep = (endLng - startLng) / steps;
  
  let currentLat = startLat;
  let currentLng = startLng;
  let stepCount = 0;

  const pingInterval = setInterval(async () => {
    currentLat += latStep;
    currentLng += lngStep;
    stepCount++;

    const status = stepCount >= steps ? 'arrived' : 'in-transit';
    
    // Calculate dummy speed in km/h just for show
    const speed = 40 + Math.floor(Math.random() * 20); 

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

    if (stepCount >= steps) {
      console.log(`Simulation finished for Route: ${routeId}`);
      clearInterval(pingInterval);
    }
  }, 5000);
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

module.exports = simulateBus;
