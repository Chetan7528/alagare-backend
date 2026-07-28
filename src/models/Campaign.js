'use strict';
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    routeId: { type: String, default: 'all', trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    operator: { type: String, trim: true },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Campaign', campaignSchema);
