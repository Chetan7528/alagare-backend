'use strict';
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true, trim: true },
    passenger: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
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
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Booking', bookingSchema);
