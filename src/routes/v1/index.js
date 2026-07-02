'use strict';
const express = require('express');
const router = express.Router();
const apiKeyAuth = require('@middlewares/apiKeyMiddleware');
const { listRoutes, searchBuses, bookBus } = require('@controllers/busController');

router.use(apiKeyAuth);

router.get('/health', (req, res) => {
  res.json({
    status: true,
    data: {
      service: 'Alagare Bus Booking API',
      version: 'v1',
      partner: req.partner.companyName,
    },
  });
});

router.get('/buses/routes', listRoutes);
router.post('/buses/search', searchBuses);
router.post('/buses/book', bookBus);

module.exports = router;
