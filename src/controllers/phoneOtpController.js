'use strict';
const response = require('@responses');

const STATIC_OTP = '7777';
const otpStore = new Map();

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || String(phone).trim().length < 7) {
      return response.badReq(res, { message: 'Valid phone number is required' });
    }

    const otp = STATIC_OTP;
    const key = String(phone).trim();
    otpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`[OTP] Sent ${otp} to ${key}`);

    return response.ok(res, { message: 'OTP sent successfully' });
  } catch (error) {
    return response.error(res, error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return response.badReq(res, { message: 'phone and otp are required' });
    }

    const key = String(phone).trim();
    const record = otpStore.get(key);

    if (!record) {
      return response.badReq(res, { message: 'OTP not found. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return response.badReq(res, { message: 'OTP has expired. Please request a new one.' });
    }

    if (String(otp).trim() !== record.otp) {
      return response.badReq(res, { message: 'Invalid OTP. Please try again.' });
    }

    otpStore.delete(key);
    return response.ok(res, { message: 'Phone verified successfully', verified: true });
  } catch (error) {
    return response.error(res, error);
  }
};

const operatorLogin = async (req, res) => {
  try {
    const User = require('@models/User');
    const jwt = require('jsonwebtoken');
    const { buildClientKeys } = require('@lib/clientKeys');
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return response.badReq(res, { message: 'phone and otp are required' });
    }

    const key = String(phone).trim();
    const record = otpStore.get(key);

    if (!record) {
      return response.badReq(res, { message: 'OTP not found. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return response.badReq(res, { message: 'OTP expired. Please request a new one.' });
    }

    if (String(otp).trim() !== record.otp) {
      return response.badReq(res, { message: 'Invalid OTP. Please try again.' });
    }

    otpStore.delete(key);

    console.log('[operatorLogin] Looking for phone:', key);
    const allOperators = await User.findOne({ role: 'operator' });
    console.log('[operatorLogin] Sample operator phone in DB:', allOperators?.phone);

    const user = await User.findOne({
      role: 'operator',
      $or: [
        { phone: key },
        { phone: key.replace(/^\+/, '') },
        { phone: '+' + key.replace(/^\+/, '') },
        { email: key },
      ],
    });

    if (!user) {
      return response.unAuthorize(res, {
        message: 'No approved operator account found for this phone number. Please ensure your application has been approved.',
      });
    }

    if (user.isBlocked) {
      return response.unAuthorize(res, { message: 'Your account has been blocked. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const userData = await User.findById(user._id).select('-password');

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
};

module.exports = { sendOtp, verifyOtp, operatorLogin };
