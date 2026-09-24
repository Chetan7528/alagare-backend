'use strict';
const mongoose = require('mongoose');

const appContentSchema = new mongoose.Schema(
  {
    termsTitleEn: {
      type: String,
      default: 'Terms of Service',
      trim: true,
    },
    termsTitleFr: {
      type: String,
      default: "Conditions Générales d'Utilisation",
      trim: true,
    },
    termsTitle: {
      type: String,
      default: 'Terms of Service',
      trim: true,
    },
    termsBodyEn: {
      type: String,
      default: '',
    },
    termsBodyFr: {
      type: String,
      default: '',
    },
    termsBody: {
      type: String,
      default: '',
    },

    privacyTitleEn: {
      type: String,
      default: 'Privacy Policy',
      trim: true,
    },
    privacyTitleFr: {
      type: String,
      default: 'Politique de Confidentialité',
      trim: true,
    },
    privacyTitle: {
      type: String,
      default: 'Privacy Policy',
      trim: true,
    },
    privacyBodyEn: {
      type: String,
      default: '',
    },
    privacyBodyFr: {
      type: String,
      default: '',
    },
    privacyBody: {
      type: String,
      default: '',
    },

    operatorTermsTitleEn: {
      type: String,
      default: 'Operator Terms of Service',
      trim: true,
    },
    operatorTermsTitleFr: {
      type: String,
      default: 'Conditions Générales Partenaires Transporteurs',
      trim: true,
    },
    operatorTermsTitle: {
      type: String,
      default: 'Operator Terms of Service',
      trim: true,
    },
    operatorTermsBodyEn: {
      type: String,
      default: '',
    },
    operatorTermsBodyFr: {
      type: String,
      default: '',
    },
    operatorTermsBody: {
      type: String,
      default: '',
    },

    operatorPrivacyTitleEn: {
      type: String,
      default: 'Operator Privacy Policy',
      trim: true,
    },
    operatorPrivacyTitleFr: {
      type: String,
      default: 'Politique de Confidentialité Partenaires',
      trim: true,
    },
    operatorPrivacyTitle: {
      type: String,
      default: 'Operator Privacy Policy',
      trim: true,
    },
    operatorPrivacyBodyEn: {
      type: String,
      default: '',
    },
    operatorPrivacyBodyFr: {
      type: String,
      default: '',
    },
    operatorPrivacyBody: {
      type: String,
      default: '',
    },

    faqs: [
      {
        questionEn: { type: String, trim: true },
        answerEn: { type: String, trim: true },
        questionFr: { type: String, trim: true },
        answerFr: { type: String, trim: true },
        question: { type: String, trim: true },
        answer: { type: String, trim: true },
      },
    ],
    operatorFaqs: [
      {
        questionEn: { type: String, trim: true },
        answerEn: { type: String, trim: true },
        questionFr: { type: String, trim: true },
        answerFr: { type: String, trim: true },
        question: { type: String, trim: true },
        answer: { type: String, trim: true },
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
