'use strict';
const mongoose = require('mongoose');

const payoutSettlementSchema = new mongoose.Schema(
  {
    settlementId: { type: String, required: true, unique: true, trim: true },
    operator: { type: String, required: true, trim: true },
    requestedAmount: { type: Number, required: true, min: 0 },
    commissionDeducted: { type: Number, default: 0, min: 0 },
    netPayout: { type: Number, required: true, min: 0 },
    bankDetails: { type: String, default: 'HDFC Bank (A/C: *******8492)' },
    notes: { type: String, default: '' },
    period: { type: String, default: 'Current Settlement' },
    paymentMethod: { type: String, default: 'Direct Bank Transfer (NEFT)' },
    status: {
      type: String,
      enum: ['pending', 'verified', 'settled', 'suspended', 'rejected'],
      default: 'pending',
    },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PayoutSettlement', payoutSettlementSchema);
