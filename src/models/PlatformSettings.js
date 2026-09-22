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
    commissionRate: { type: Number, default: 5, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    notifyBookings: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceTitleEn: {
      type: String,
      default: 'Under Maintenance',
      trim: true,
    },
    maintenanceMessageEn: {
      type: String,
      default: "Alagare is currently undergoing scheduled maintenance. We'll be back shortly!",
      trim: true,
    },
    maintenanceTitleFr: {
      type: String,
      default: 'Maintenance en cours',
      trim: true,
    },
    maintenanceMessageFr: {
      type: String,
      default: 'Alagare est actuellement en maintenance planifiée. Nous serons bientôt de retour !',
      trim: true,
    },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

platformSettingsSchema.index({ api_user: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
