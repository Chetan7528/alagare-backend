'use strict';
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  sendOTP,
  verifyOTP,
  resendOTP,
  changePassword,
  updatePassword,
  myProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  deleteUser,
  blockUser,
} = require('@controllers/authController');
const auth = require('@middlewares/authMiddleware');
const { upload } = require('@services/fileUpload');
const busController = require('@controllers/busController');

// Public (still need X-API-Key from global middleware)
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/change-password', changePassword);

// User (protected JWT)
router.get('/profile', auth(), myProfile);
router.put('/profile', auth(), upload.single('image'), updateProfile);
router.put('/password', auth(), updatePassword);

// Mobile app bus APIs (JWT + X-API-Key — tenant = req.apiUser)
router.get('/buses/home', auth(), busController.getHomeContent);
router.get('/buses/cities', auth(), busController.searchCities);
router.get('/buses/routes', auth(), busController.listRoutes);
router.get('/buses/routes/:routeId/seats', auth(), busController.getRouteSeats);
router.get('/buses/routes/:routeId/details', auth(), busController.getTripDetails);
router.post('/buses/search', auth(), busController.searchBuses);
router.post('/buses/book', auth(), busController.bookBus);

// Help & Support inquiries (JWT + X-API-Key)
const inquiryController = require('@controllers/inquiryController');
router.post('/inquiries', auth(), inquiryController.createInquiry);
router.get('/inquiries', auth(), inquiryController.listMyInquiries);

// Legal content — X-API-Key only (Sign Up before login)
const contentController = require('@controllers/contentController');
router.get('/content', contentController.getPublicContent);

const settingsController = require('@controllers/settingsController');
router.get('/settings', settingsController.getPublicSettings);

// Admin
router.get('/users', auth('admin'), getAllUsers);
router.get('/users/:id', auth('admin'), getUserById);
router.delete('/users/:id', auth('admin'), deleteUser);
router.put('/users/block', auth('admin'), blockUser);

module.exports = router;
