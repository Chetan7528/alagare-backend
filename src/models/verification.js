'use strict';
const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: String,
    },
    expiration_at: { type: Date, required: true },
    otp: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: { type: Number, default: 0 },
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  {
    timestamps: true,
  },
);

verificationSchema.set('toJSON', {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Verification', verificationSchema);
