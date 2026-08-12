'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Invalid email'],
      sparse: true,
    },
    password: { type: String, minlength: 6 },
    phone: { type: String, required: true, unique: true, trim: true },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'male', 'female', 'other'],
      default: 'Male',
    },
    image: { type: String },
    role: { type: String, enum: ['user', 'admin', 'operator'], default: 'user' },
    membership: {
      type: String,
      enum: ['Standard', 'Silver', 'Gold', 'Platinum'],
      default: 'Standard',
    },
    notificationPrefs: {
      bookingConfirmed: { type: Boolean, default: true },
      bookingReminder: { type: Boolean, default: true },
      tripUpdates: { type: Boolean, default: true },
      promoOffers: { type: Boolean, default: false },
      newRoutes: { type: Boolean, default: false },
      appAnnouncements: { type: Boolean, default: false },
      emailReceipts: { type: Boolean, default: true },
      emailOffers: { type: Boolean, default: false },
      pushEnabled: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    lastLogin: { type: Date },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
