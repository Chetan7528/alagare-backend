'use strict';
const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    platformName: { type: String, default: 'Alagare', trim: true },
    supportEmail: { type: String, default: 'support@alagare.com', trim: true },
    currency: {
      type: String,
      enum: ['EUR', 'USD', 'GBP', 'INR'],
      default: 'EUR',
    },
    timezone: {
      type: String,
      default: 'Europe/Berlin',
      trim: true,
    },
    notifyBookings: { type: Boolean, default: true },
    notifyUsers: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

platformSettingsSchema.index({ api_user: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
