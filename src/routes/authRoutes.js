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

/** Attach partner context for mobile JWT bus endpoints */
const mobileBusContext = (req, res, next) => {
  req.partner = { companyName: 'Alagare Mobile' };
  next();
};

// Public
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/change-password', changePassword);

// User (protected)
router.get('/profile', auth(), myProfile);
router.put('/profile', auth(), upload.single('image'), updateProfile);
router.put('/password', auth(), updatePassword);

// Mobile app bus APIs (JWT — same data as /api/v1 for logged-in users)
router.get('/buses/routes', auth(), mobileBusContext, busController.listRoutes);
router.post('/buses/search', auth(), mobileBusContext, busController.searchBuses);
router.post('/buses/book', auth(), mobileBusContext, busController.bookBus);

// Admin
router.get('/users', auth('admin'), getAllUsers);
router.get('/users/:id', auth('admin'), getUserById);
router.delete('/users/:id', auth('admin'), deleteUser);
router.put('/users/block', auth('admin'), blockUser);

module.exports = router;
