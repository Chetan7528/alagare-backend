'use strict';
const mongoose = require('mongoose');

const callbackRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    country: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'resolved'],
      default: 'pending',
    },
    notes: { type: String, default: '', trim: true },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true }
);

callbackRequestSchema.index({ api_user: 1, createdAt: -1 });

module.exports = mongoose.model('CallbackRequest', callbackRequestSchema);
