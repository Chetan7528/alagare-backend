'use strict';
const mongoose = require('mongoose');

const operatorApplicationSchema = new mongoose.Schema(
  {
    companyName:      { type: String, required: true, trim: true },
    registrationNo:   { type: String, required: true, trim: true },
    gst:              { type: String, trim: true, default: '' },
    yearFounded:      { type: String, trim: true, default: '' },
    ownerName:        { type: String, required: true, trim: true },
    email:            { type: String, required: true, lowercase: true, trim: true },
    phone:            { type: String, required: true, trim: true },
    address:          { type: String, trim: true, default: '' },
    city:             { type: String, trim: true, default: '' },
    state:            { type: String, trim: true, default: '' },
    totalBuses:       { type: Number, default: 0 },
    routesCovered:    { type: Number, default: 0 },
    busTypes:         { type: [String], default: [] },
    docs: {
      registration: { type: String, default: '' },
      permit:       { type: String, default: '' },
      vehicle:      { type: String, default: '' },
      insurance:    { type: String, default: '' },
      bank:         { type: String, default: '' },
      id:           { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('OperatorApplication', operatorApplicationSchema);
