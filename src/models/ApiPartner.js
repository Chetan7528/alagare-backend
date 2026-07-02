'use strict';
const mongoose = require('mongoose');

const apiPartnerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    apiKeyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    permissions: {
      type: [String],
      default: ['bus:search', 'bus:routes', 'bus:book'],
    },
    webhookUrl: { type: String, trim: true },
    rateLimitPerMinute: { type: Number, default: 120 },
    lastUsedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ApiPartner', apiPartnerSchema);
