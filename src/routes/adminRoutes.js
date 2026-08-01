'use strict';
const express = require('express');
const router = express.Router();
const auth = require('@middlewares/authMiddleware');
const { upload } = require('@services/fileUpload');
const {
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getHomeContent,
  updateHomeContent,
  updateRouteSeats,
} = require('@controllers/adminBusController');

router.get('/routes', auth('admin'), listRoutes);
router.post('/routes', auth('admin'), createRoute);
router.put('/routes/:id', auth('admin'), updateRoute);
router.delete('/routes/:id', auth('admin'), deleteRoute);
router.put('/routes/:id/seats', auth('admin'), updateRouteSeats);

router.get('/home', auth('admin'), getHomeContent);
router.put(
  '/home',
  auth('admin'),
  upload.fields([
    { name: 'headerImage', maxCount: 1 },
    { name: 'promoImage', maxCount: 1 },
  ]),
  updateHomeContent,
);

const {
  listOperators,
  createOperator,
  updateOperator,
  deleteOperator,
  listBookings,
  updateBookingStatus,
  getDashboard,
  listUsers,
  updateUser,
  deleteUser,
} = require('@controllers/adminOpsController');

const {
  listCities,
  createCity,
  updateCity,
  deleteCity,
  listBusTypes,
  createBusType,
  updateBusType,
  deleteBusType,
  listSettlements,
  updateSettlementStatus,
} = require('@controllers/adminMasterController');

router.get('/dashboard', auth('admin'), getDashboard);

router.get('/users', auth('admin'), listUsers);
router.put('/users/:id', auth('admin'), updateUser);
router.delete('/users/:id', auth('admin'), deleteUser);

router.get('/operators', auth('admin'), listOperators);
router.post('/operators', auth('admin'), createOperator);
router.put('/operators/:id', auth('admin'), updateOperator);
router.delete('/operators/:id', auth('admin'), deleteOperator);

router.get('/bookings', auth('admin'), listBookings);
router.put('/bookings/:id/status', auth('admin'), updateBookingStatus);

router.get('/cities', auth('admin'), listCities);
router.post('/cities', auth('admin'), createCity);
router.put('/cities/:id', auth('admin'), updateCity);
router.delete('/cities/:id', auth('admin'), deleteCity);

router.get('/bus-types', auth('admin'), listBusTypes);
router.post('/bus-types', auth('admin'), createBusType);
router.put('/bus-types/:id', auth('admin'), updateBusType);
router.delete('/bus-types/:id', auth('admin'), deleteBusType);

router.get('/settlements', auth('admin'), listSettlements);
router.put('/settlements/:id/status', auth('admin'), updateSettlementStatus);

const {
  getContent,
  updateContent,
} = require('@controllers/contentController');

router.get('/content', auth('admin'), getContent);
router.put('/content', auth('admin'), updateContent);

const {
  listInquiries,
  updateInquiry,
} = require('@controllers/inquiryController');

router.get('/inquiries', auth('admin'), listInquiries);
router.put('/inquiries/:id', auth('admin'), updateInquiry);

const {
  getSettings,
  updateSettings,
} = require('@controllers/settingsController');

router.get('/settings', auth('admin'), getSettings);
router.put('/settings', auth('admin'), updateSettings);

const {
  listCallbacks,
  updateCallbackStatus,
  deleteCallback,
} = require('@controllers/operatorFleetController');

router.get('/callbacks', auth('admin'), listCallbacks);
router.put('/callbacks/:id/status', auth('admin'), updateCallbackStatus);
router.delete('/callbacks/:id', auth('admin'), deleteCallback);

module.exports = router;
