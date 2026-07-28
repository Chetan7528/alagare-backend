'use strict';
const mongoose = require('mongoose');

const appContentSchema = new mongoose.Schema(
  {
    termsTitle: {
      type: String,
      default: 'Terms of Service',
      trim: true,
    },
    termsBody: {
      type: String,
      default: '',
    },
    privacyTitle: {
      type: String,
      default: 'Privacy Policy',
      trim: true,
    },
    privacyBody: {
      type: String,
      default: '',
    },
    operatorTermsTitle: {
      type: String,
      default: 'Operator Terms of Service',
      trim: true,
    },
    operatorTermsBody: {
      type: String,
      default: '',
    },
    operatorPrivacyTitle: {
      type: String,
      default: 'Operator Privacy Policy',
      trim: true,
    },
    operatorPrivacyBody: {
      type: String,
      default: '',
    },
    faqs: [
      {
        question: { type: String, trim: true, required: true },
        answer: { type: String, trim: true, required: true },
      },
    ],
    operatorFaqs: [
      {
        question: { type: String, trim: true, required: true },
        answer: { type: String, trim: true, required: true },
      },
    ],
    api_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiUser',
    },
  },
  { timestamps: true },
);

appContentSchema.index({ api_user: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AppContent', appContentSchema);
