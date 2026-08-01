'use strict';
const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, trim: true },
    operator: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    departure: { type: String, required: true, trim: true },
    arrival: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'EUR', trim: true },
    seats: { type: Number, required: true, min: 1 },
    seatsAvailable: { type: Number, required: true, min: 0 },
    busType: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isPopular: { type: Boolean, default: false },
    occupiedSeats: { type: [String], default: [] },
    ladiesSeats: { type: [String], default: ['0-1', '2-0', '5-2', '5-3', '7-1'] },

    /** Trip Details screen (admin-managed) */
    isExpress: { type: Boolean, default: true },
    departureStation: { type: String, default: '', trim: true },
    arrivalStation: { type: String, default: '', trim: true },
    departureGate: { type: String, default: '', trim: true },
    arrivalPlatform: { type: String, default: '', trim: true },
    transferStation: { type: String, default: '', trim: true },
    transferTime: { type: String, default: '', trim: true },
    transferNote: { type: String, default: '', trim: true },
    facilities: {
      type: [String],
      default: ['wifi', 'power', 'ac', 'reclining'],
    },
    cancellationPolicy: {
      type: String,
      default: 'Full refund up to 24h before departure',
      trim: true,
    },
    cancellationPolicyDetail: {
      type: String,
      default: 'Full refund if cancelled 24 hours prior to departure. 50% refund between 12-24h. Non-refundable within 12 hours.',
      trim: true,
    },
    luggagePolicy: {
      type: String,
      default: '1 Carry-on + 1 Checked bag Included',
      trim: true,
    },
    luggagePolicyDetail: {
      type: String,
      default: 'Includes 1 hand luggage (max 7kg) and 1 check-in bag (max 20kg). Excess baggage fee applies at gate.',
      trim: true,
    },
    benefitNote: {
      type: String,
      default: 'Standard Premier includes meal and lounge access.',
      trim: true,
    },
    taxRate: { type: Number, default: 0.086, min: 0 },
    serviceFee: { type: Number, default: 4.5, min: 0 },

    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

busRouteSchema.index({ routeId: 1, api_user: 1 }, { unique: true });

module.exports = mongoose.model('BusRoute', busRouteSchema);
