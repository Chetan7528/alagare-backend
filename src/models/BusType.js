'use strict';
const mongoose = require('mongoose');

const busTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Seat map template (RedBus-style): layout lives on bus type, not each trip */
    rowCount: { type: Number, default: 10, min: 1 },
    seatsPerSide: { type: Number, default: 2, min: 1 },
    totalSeats: { type: Number, default: 40, min: 1 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

busTypeSchema.index({ name: 1, api_user: 1 }, { unique: true });

module.exports = mongoose.model('BusType', busTypeSchema);
