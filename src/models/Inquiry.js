'use strict';
const mongoose = require('mongoose');

const INQUIRY_CATEGORIES = [
  'booking',
  'cancellation_refund',
  'payment',
  'bus_operator',
  'boarding_seat',
  'other',
];

const inquirySchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    bookingId: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: INQUIRY_CATEGORIES,
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    adminNote: { type: String, default: '', trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

inquirySchema.index({ api_user: 1, createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
module.exports.INQUIRY_CATEGORIES = INQUIRY_CATEGORIES;
