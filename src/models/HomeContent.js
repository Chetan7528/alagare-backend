'use strict';
const mongoose = require('mongoose');

const homeContentSchema = new mongoose.Schema(
  {
    headerImage: { type: String, default: '' },
    promoImage: { type: String, default: '' },
    promoBadge: { type: String, default: 'LIMITED OFFER', trim: true },
    promoTitle: { type: String, default: 'Save 20% on First Trip', trim: true },
    promoDesc: {
      type: String,
      default: 'Use code FIRSTRIDE at checkout for all intercity bookings this month.',
      trim: true,
    },
    promoCode: { type: String, default: 'FIRSTRIDE', trim: true },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

homeContentSchema.index({ api_user: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('HomeContent', homeContentSchema);
