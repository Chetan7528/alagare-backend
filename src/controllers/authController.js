'use strict';
const User = require('@models/User');
const Verification = require('@models/verification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const response = require('@responses');
const userHelper = require('../helper/user');
const { sendOtpEmail } = require('@services/emailService');

module.exports = {
  
  register: async (req, res) => {
    try {
      const { fullname, email, password, phone, role } = req.body;

      if (!fullname || !email || !password) {
        return response.badReq(res, { message: 'fullname, email and password are required' });
      }

      const exists = await User.findOne({ email });
      if (exists) return response.badReq(res, { message: 'Email already registered' });

      const hashed = await bcrypt.hash(password, 10);

      const userPayload = {
        fullname,
        email,
        password: hashed,
        role: role === 'admin' ? 'admin' : 'user',
      };
      if (phone) userPayload.phone = phone;

      const user = await User.create(userPayload);

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      const data = await User.findById(user._id).select('-password');
      return response.created(res, { message: 'Registered successfully', data, token });
    } catch (error) {
      return response.error(res, error);
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return response.badReq(res, { message: 'Email and password are required' });
      }

      const user = await User.findOne({ email });
      if (!user) return response.unAuthorize(res, { message: 'No account found with this email' });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return response.unAuthorize(res, { message: 'Incorrect password' });

      if (user.isBlocked) {
        return response.unAuthorize(res, { message: 'Your account has been blocked' });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      const userData = await User.findById(user._id).select('-password');
      return response.ok(res, { message: 'Login successful', token, user: userData });
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
      return response.ok(res, { data: user });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // User: update own profile
  updateProfile: async (req, res) => {
    try {
      const { fullname, phone } = req.body;
      const update = {};
      if (fullname) update.fullname = fullname;
      if (phone) update.phone = phone;
      if (req.file) update.image = req.file.path;

      const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select(
        '-password',
      );
      return response.ok(res, { message: 'Profile updated', data: user });
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

      return response.ok(res, {
        message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
        data: user,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
