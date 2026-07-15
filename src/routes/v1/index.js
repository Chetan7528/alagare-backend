'use strict';
const express = require('express');
const router = express.Router();
const {
  listRoutes,
  searchBuses,
  bookBus,
  getHomeContent,
  getRouteSeats,
  getTripDetails,
  searchCities,
} = require('@controllers/busController');

/**
 * Sellable third-party API — X-API-Key already checked globally in app.js
 * Base: /api/v1
 */
router.get('/health', (req, res) => {
  res.json({
    status: true,
    data: {
      service: 'Alagare Bus Booking API',
      version: 'v1',
      api_user: req.apiUser
        ? `${req.apiUser.first_name} ${req.apiUser.last_name}`
        : null,
    },
  });
});

router.get('/buses/home', getHomeContent);
router.get('/buses/cities', searchCities);
router.get('/buses/routes', listRoutes);
router.get('/buses/routes/:routeId/seats', getRouteSeats);
router.get('/buses/routes/:routeId/details', getTripDetails);
router.post('/buses/search', searchBuses);
router.post('/buses/book', bookBus);

module.exports = router;
