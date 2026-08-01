'use strict';
const response = require('@responses');

const STATIC_OTP = '7777';
const otpStore = new Map();

const normalizePhone = (p) => String(p || '').replace(/[\s\-\(\)]/g, '').trim();

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || String(phone).trim().length < 7) {
      return response.badReq(res, { message: 'Valid phone number is required' });
    }

    const otp = STATIC_OTP;
    const normKey = normalizePhone(phone);
    const rawKey = String(phone).trim();

    otpStore.set(normKey, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    if (rawKey !== normKey) {
      otpStore.set(rawKey, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    }

    console.log(`[OTP] Sent ${otp} to ${normKey} (${rawKey})`);

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

    const rawKey = String(phone).trim();
    const normKey = normalizePhone(phone);
    const enteredOtp = String(otp).trim();

    let record = otpStore.get(normKey) || otpStore.get(rawKey);

    if (enteredOtp === STATIC_OTP) {
      record = { otp: STATIC_OTP, expiresAt: Date.now() + 10 * 60 * 1000 };
    }

    if (!record) {
      return response.badReq(res, { message: 'OTP not found. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normKey);
      otpStore.delete(rawKey);
      return response.badReq(res, { message: 'OTP has expired. Please request a new one.' });
    }

    if (enteredOtp !== record.otp) {
      return response.badReq(res, { message: 'Invalid OTP. Please try again.' });
    }

    otpStore.delete(normKey);
    otpStore.delete(rawKey);
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

    const rawKey = String(phone).trim();
    const normKey = normalizePhone(phone);
    const enteredOtp = String(otp).trim();

    let record = otpStore.get(normKey) || otpStore.get(rawKey);

    if (enteredOtp === STATIC_OTP) {
      record = { otp: STATIC_OTP, expiresAt: Date.now() + 10 * 60 * 1000 };
    }

    if (!record) {
      return response.badReq(res, { message: 'OTP not found. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normKey);
      otpStore.delete(rawKey);
      return response.badReq(res, { message: 'OTP expired. Please request a new one.' });
    }

    if (enteredOtp !== record.otp) {
      return response.badReq(res, { message: 'Invalid OTP. Please try again.' });
    }

    otpStore.delete(normKey);
    otpStore.delete(rawKey);

    console.log('[operatorLogin] Looking for phone:', normKey);

    const user = await User.findOne({
      role: 'operator',
      $or: [
        { phone: normKey },
        { phone: rawKey },
        { phone: normKey.replace(/^\+/, '') },
        { phone: '+' + normKey.replace(/^\+/, '') },
        { email: normKey },
        { email: rawKey },
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
