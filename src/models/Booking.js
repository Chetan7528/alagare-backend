'use strict';
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true, trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    passenger: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    route: { type: String, required: true, trim: true },
    routeId: { type: String, trim: true },
    operator: { type: String, trim: true },
    date: { type: String, trim: true },
    departure: { type: String, trim: true },
    arrival: { type: String, trim: true },
    departureStation: { type: String, trim: true },
    arrivalStation: { type: String, trim: true },
    busType: { type: String, trim: true },
    seats: { type: Number, default: 1 },
    seatKeys: { type: [String], default: [] },
    operatorBaseFare: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: { type: String, trim: true },
    paymentIntentId: { type: String, trim: true },
    paymentStatus: { type: String, default: 'pending', trim: true },
    promoCode: { type: String, trim: true, uppercase: true },
    discountAmount: { type: Number, default: 0 },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Booking', bookingSchema);
