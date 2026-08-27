'use strict';
const User = require('@models/User');
const Verification = require('@models/verification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const response = require('@responses');
const userHelper = require('../helper/user');
const { sendOtpEmail } = require('@services/emailService');
const { fileUrl } = require('@services/fileUpload');
const { buildClientKeys } = require('@lib/clientKeys');
const Device = require('@models/Device');
const { notifyUser } = require('@services/notification');

module.exports = {
  
  register: async (req, res) => {
    try {
      const { fullname, email, password, phone, gender, role } = req.body;

      if (!fullname || !phone) {
        return response.badReq(res, { message: 'fullname and phone are required' });
      }

      const exists = await User.findOne({ phone });
      if (exists) {
        if (exists.isVerified) {
          return response.badReq(res, { message: 'Phone already registered and verified' });
        }
        // If exists but not verified, we can resend OTP (handled below by updating user and sending OTP)
      }

      let hashed = null;
      if (password) {
        hashed = await bcrypt.hash(password, 10);
      }

      const userPayload = {
        fullname,
        phone,
        role: role === 'admin' ? 'admin' : 'user',
        isVerified: false,
        api_user: req.apiUser?._id,
      };
      if (email) userPayload.email = email;
      if (hashed) userPayload.password = hashed;
      if (gender) userPayload.gender = gender;

      let user = exists;
      if (user) {
        await User.updateOne({ _id: user._id }, userPayload);
      } else {
        user = await User.create(userPayload);
      }

      // Generate OTP (Bypass 7777 as requested)
      const otp = '7777'; 
      await Verification.deleteMany({ user: phone });
      await Verification.create({
        user: phone,
        otp,
        expiration_at: new Date(Date.now() + 5 * 60 * 1000),
      });

      return response.created(res, {
        message: 'OTP sent to your phone',
        phone,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  verifyRegister: async (req, res) => {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) return response.badReq(res, { message: 'phone and otp are required' });

      const ver = await Verification.findOne({ user: phone, otp });
      if (!ver) return response.badReq(res, { message: 'Invalid OTP' });
      if (ver.expiration_at < new Date()) return response.badReq(res, { message: 'OTP expired' });

      const user = await User.findOne({ phone });
      if (!user) return response.notFound(res, { message: 'User not found' });

      user.isVerified = true;
      await user.save();
      await Verification.deleteMany({ user: phone });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      const data = user.toObject();
      delete data.password;

      return response.ok(res, {
        message: 'Registered and verified successfully',
        data,
        token,
        apiKey: req.apiUser?.api_key || null,
        keys: buildClientKeys(req.apiUser),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  login: async (req, res) => {
    try {
      const { phone, email, password } = req.body;

      if (phone) {
        const user = await User.findOne({ phone });
        if (!user) return response.unAuthorize(res, { message: 'No account found with this phone' });
        if (user.isBlocked) return response.unAuthorize(res, { message: 'Your account has been blocked' });

        const otp = '7777';
        await Verification.deleteMany({ user: phone });
        await Verification.create({
          user: phone,
          otp,
          expiration_at: new Date(Date.now() + 5 * 60 * 1000),
        });

        return response.ok(res, {
          message: 'OTP sent successfully',
          phone
        });
      }

      if (!email || !password) {
        return response.badReq(res, { message: 'Email/Password or Phone is required' });
      }

      const user = await User.findOne({ email });
      if (!user) return response.unAuthorize(res, { message: 'Invalid credentials' });
      if (user.isBlocked) return response.unAuthorize(res, { message: 'Your account has been blocked' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return response.unAuthorize(res, { message: 'Invalid credentials' });

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      const userData = user.toObject();
      delete userData.password;
      return response.ok(res, {
        message: 'Login successful',
        token,
        user: userData,
        apiKey: req.apiUser?.api_key || null,
        keys: buildClientKeys(req.apiUser),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  verifyLogin: async (req, res) => {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) return response.badReq(res, { message: 'phone and otp are required' });

      const ver = await Verification.findOne({ user: phone, otp });
      if (!ver) return response.badReq(res, { message: 'Invalid OTP' });
      if (ver.expiration_at < new Date()) return response.badReq(res, { message: 'OTP expired' });

      const user = await User.findOne({ phone });
      if (!user) return response.unAuthorize(res, { message: 'User not found' });

      user.lastLogin = new Date();
      if (!user.isVerified) user.isVerified = true; // Auto verify if they manage to login
      await user.save();
      await Verification.deleteMany({ user: phone });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      if (req.body.device_token || req.body.player_id) {
        await Device.updateOne(
          { device_token: req.body.device_token },
          { $set: { player_id: req.body.player_id, user: user._id } },
          { upsert: true },
        );
      }

      const userData = user.toObject();
      delete userData.password;
      return response.ok(res, {
        message: 'Login successful',
        token,
        user: userData,
        apiKey: req.apiUser?.api_key || null,
        keys: buildClientKeys(req.apiUser),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  sendOTP: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return response.badReq(res, { message: 'Email required' });

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) return response.badReq(res, { message: 'No account found with this email' });

      const existing = await Verification.findOne({ user: user._id });
      if (existing && existing.expiration_at > new Date()) {
        return response.badReq(res, { message: 'OTP already sent. Please wait before retrying.' });
      }

      await Verification.deleteMany({ user: user._id });

      const otp = crypto.randomInt(100000, 1000000).toString();
      const ver = await Verification.create({
        user: user._id,
        otp,
        expiration_at: new Date(Date.now() + 5 * 60 * 1000),
        api_user: req.apiUser?._id,
      });

      try {
        await sendOtpEmail({ email: user.email, name: user.fullname, otp });
      } catch (mailErr) {
        console.error('OTP email failed:', mailErr);
        return response.error(res, {
          message: mailErr?.message || 'Failed to send OTP email. Please try again.',
        });
      }

      const token = await userHelper.encode(ver._id);
      return response.ok(res, { message: 'OTP sent to your email', token });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Public: verify OTP
  verifyOTP: async (req, res) => {
    try {
      const { otp, token } = req.body;
      if (!otp || !token) return response.badReq(res, { message: 'OTP and token required' });

      const verId = await userHelper.decode(token);
      const ver = await Verification.findById(verId);

      if (!ver) return response.badReq(res, { message: 'Invalid or expired token' });
      if (new Date() > ver.expiration_at) {
        await Verification.deleteOne({ _id: ver._id });
        return response.badReq(res, { message: 'OTP expired' });
      }
      if (ver.verified) return response.badReq(res, { message: 'OTP already used' });
      if (ver.attempts >= 5) {
        await Verification.deleteOne({ _id: ver._id });
        return response.badReq(res, { message: 'Too many attempts. Request a new OTP.' });
      }

      if (otp !== ver.otp) {
        ver.attempts += 1;
        await ver.save();
        return response.badReq(res, { message: 'Invalid OTP' });
      }

      ver.verified = true;
      await ver.save();

      const expiry = Date.now() + 10 * 60 * 1000;
      const resetToken = await userHelper.encode(`${ver._id}:${expiry}`);

      return response.ok(res, { message: 'OTP verified', token: resetToken });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Public: resend OTP
  resendOTP: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return response.badReq(res, { message: 'Email required' });

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) return response.badReq(res, { message: 'No account found with this email' });

      await Verification.deleteMany({ user: user._id });

      const otp = crypto.randomInt(100000, 1000000).toString();
      const ver = await Verification.create({
        user: user._id,
        otp,
        expiration_at: new Date(Date.now() + 5 * 60 * 1000),
        api_user: req.apiUser?._id,
      });

      try {
        await sendOtpEmail({ email: user.email, name: user.fullname, otp });
      } catch (mailErr) {
        console.error('OTP email failed:', mailErr);
        return response.error(res, {
          message: mailErr?.message || 'Failed to resend OTP email. Please try again.',
        });
      }

      const token = await userHelper.encode(ver._id);
      return response.ok(res, { message: 'OTP resent', token });
    } catch (error) {
      return response.error(res, error);
    }
  },

  
  changePassword: async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return response.badReq(res, { message: 'Token and new password required' });
      }

      let decoded;
      try {
        decoded = await userHelper.decode(token);
      } catch {
        return response.forbidden(res, { message: 'Invalid token' });
      }

      const [verID, expiry] = decoded.split(':');
      if (!verID || !expiry || Date.now() > Number(expiry)) {
        return response.forbidden(res, { message: 'Reset session expired. Request a new OTP.' });
      }

      const ver = await Verification.findById(verID);
      if (!ver) return response.forbidden(res, { message: 'Invalid session' });
      if (!ver.verified) return response.forbidden(res, { message: 'OTP not verified' });

      const user = await User.findById(ver.user);
      if (!user) return response.forbidden(res, { message: 'User not found' });

      user.password = await bcrypt.hash(password, 10);
      await user.save();
      await Verification.deleteOne({ _id: verID });

      return response.ok(res, { message: 'Password changed successfully. Please login.' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  
  myProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) return response.notFound(res, { message: 'User not found' });
      const Booking = require('../models/Booking');
      const userEmail = (user.email || '').trim();
      const userPhone = (user.phone || '').trim();
      const matchQueries = [];
      if (userEmail) matchQueries.push({ email: { $regex: new RegExp('^' + userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
      if (userPhone) matchQueries.push({ phone: userPhone });
      const userBookings = await Booking.find(matchQueries.length > 0 ? { $or: matchQueries } : { email: userEmail });
      const confirmedCount = userBookings.filter((b) => b.status === 'confirmed').length;
      const totalTrips = userBookings.length;
      const totalSpent = userBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
      const totalPoints = (confirmedCount > 0 ? confirmedCount : totalTrips) * 150 + Math.round(totalSpent * 2);

      const TIER_RANK = { standard: 0, silver: 1, gold: 2, platinum: 3 };
      let tripTier = 'Standard';
      if (totalTrips >= 5) tripTier = 'Platinum';
      else if (totalTrips >= 2) tripTier = 'Gold';

      const storedMember = user.membership || 'Standard';
      const computedMember =
        TIER_RANK[tripTier.toLowerCase()] > (TIER_RANK[storedMember.toLowerCase()] ?? 0) ? tripTier : storedMember;

      const userData = user.toObject();
      userData.trips = totalTrips;
      userData.points = totalPoints;
      userData.membership = computedMember;

      return response.ok(res, { data: userData });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // User: update own profile
  updateProfile: async (req, res) => {
    try {
      const { fullname, phone, gender } = req.body;
      const update = {};
      if (fullname) update.fullname = fullname;
      if (phone) update.phone = phone;
      if (gender) update.gender = gender;
      if (req.file) update.image = fileUrl(req.file);

      const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select(
        '-password',
      );
      return response.ok(res, { message: 'Profile updated', data: user });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // User: get notification preferences
  getNotificationSettings: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('notificationPrefs');
      return response.ok(res, { data: user.notificationPrefs });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // User: update notification preferences
  updateNotificationSettings: async (req, res) => {
    try {
      const allowedKeys = [
        'bookingConfirmed', 'bookingReminder', 'tripUpdates',
        'promoOffers', 'newRoutes', 'appAnnouncements',
        'emailReceipts', 'emailOffers', 'pushEnabled', 'securityAlerts',
      ];
      const update = {};
      allowedKeys.forEach((key) => {
        if (typeof req.body[key] === 'boolean') {
          update[`notificationPrefs.${key}`] = req.body[key];
        }
      });
      // Security alerts cannot be disabled by the user, for their own safety
      update['notificationPrefs.securityAlerts'] = true;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: update },
        { new: true },
      ).select('notificationPrefs');
      return response.ok(res, {
        message: 'Notification settings updated',
        data: user.notificationPrefs,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // User: change password while logged in
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return response.badReq(res, { message: 'Current and new password are required' });
      }
      if (newPassword.length < 6) {
        return response.badReq(res, { message: 'New password must be at least 6 characters' });
      }

      const user = await User.findById(req.user._id);
      if (!user) return response.notFound(res, { message: 'User not found' });

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return response.badReq(res, { message: 'Current password is incorrect' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return response.ok(res, { message: 'Password updated successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Admin: get all users
  getAllUsers: async (req, res) => {
    try {
      let { page = 1, limit = 20, role, search } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      const filter = {};
      if (role) filter.role = role;
      if (search) {
        filter.$or = [
          { fullname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .sort('-createdAt')
          .skip((page - 1) * limit)
          .limit(limit),
        User.countDocuments(filter),
      ]);

      return response.ok(res, {
        data: users,
        pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Admin: get single user
  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) return response.notFound(res, { message: 'User not found' });
      return response.ok(res, { data: user });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Admin: delete user
  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return response.notFound(res, { message: 'User not found' });
      return response.ok(res, { message: 'User deleted successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Admin: block / unblock user
  blockUser: async (req, res) => {
    try {
      const { userId, isBlocked } = req.body;
      if (!userId) return response.badReq(res, { message: 'userId required' });

      const user = await User.findByIdAndUpdate(userId, { isBlocked }, { new: true }).select(
        '-password',
      );
      if (!user) return response.notFound(res, { message: 'User not found' });

      await notifyUser(
        user,
        'securityAlerts',
        isBlocked ? 'Account Blocked' : 'Account Unblocked',
        isBlocked
          ? 'Your account has been blocked. Contact support if you believe this is a mistake.'
          : 'Your account has been unblocked. You can sign in again.',
      );

      return response.ok(res, {
        message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
        data: user,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
