'use strict';
const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    routes: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '', trim: true },
    logo: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Operator', operatorSchema);
