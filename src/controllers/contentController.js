'use strict';
const AppContent = require('@models/AppContent');
const response = require('@responses');
const {
  APP_CONTENT_DEFAULT,
  TERMS_TITLE_EN,
  TERMS_TITLE_FR,
  TERMS_BODY_EN,
  TERMS_BODY_FR,
  PRIVACY_TITLE_EN,
  PRIVACY_TITLE_FR,
  PRIVACY_BODY_EN,
  PRIVACY_BODY_FR,
  OPERATOR_TERMS_TITLE_EN,
  OPERATOR_TERMS_TITLE_FR,
  OPERATOR_TERMS_BODY_EN,
  OPERATOR_TERMS_BODY_FR,
  OPERATOR_PRIVACY_TITLE_EN,
  OPERATOR_PRIVACY_TITLE_FR,
  OPERATOR_PRIVACY_BODY_EN,
  OPERATOR_PRIVACY_BODY_FR,
  FAQ_DEFAULTS,
  OPERATOR_FAQ_DEFAULTS,
} = require('@lib/appContentDefaults');

const tenantFilter = (req) => (req?.apiUser?._id ? { api_user: req.apiUser._id } : {});

const normalizeFaqs = (faqs) => {
  if (!Array.isArray(faqs)) return null;
  return faqs
    .map((f) => {
      const qEn = String(f?.questionEn || f?.question || '').trim();
      const aEn = String(f?.answerEn || f?.answer || '').trim();
      const qFr = String(f?.questionFr || qEn).trim();
      const aFr = String(f?.answerFr || aEn).trim();
      return {
        questionEn: qEn,
        answerEn: aEn,
        questionFr: qFr,
        answerFr: aFr,
        question: qEn || qFr,
        answer: aEn || aFr,
      };
    })
    .filter((f) => (f.questionEn || f.questionFr) && (f.answerEn || f.answerFr));
};

const ensureContent = async (req) => {
  let doc = await AppContent.findOne(tenantFilter(req));
  if (!doc) {
    doc = await AppContent.create({
      ...APP_CONTENT_DEFAULT,
      ...(req?.apiUser?._id ? { api_user: req.apiUser._id } : {}),
    });
  } else {
    let dirty = false;

    // Terms
    if (!doc.termsTitleEn?.trim()) { doc.termsTitleEn = doc.termsTitle || TERMS_TITLE_EN; dirty = true; }
    if (!doc.termsTitleFr?.trim()) { doc.termsTitleFr = TERMS_TITLE_FR; dirty = true; }
    if (!doc.termsBodyEn?.trim()) { doc.termsBodyEn = doc.termsBody || TERMS_BODY_EN; dirty = true; }
    if (!doc.termsBodyFr?.trim()) { doc.termsBodyFr = TERMS_BODY_FR; dirty = true; }
    if (!doc.termsTitle?.trim()) { doc.termsTitle = doc.termsTitleEn || TERMS_TITLE_EN; dirty = true; }
    if (!doc.termsBody?.trim()) { doc.termsBody = doc.termsBodyEn || TERMS_BODY_EN; dirty = true; }

    // Privacy
    if (!doc.privacyTitleEn?.trim()) { doc.privacyTitleEn = doc.privacyTitle || PRIVACY_TITLE_EN; dirty = true; }
    if (!doc.privacyTitleFr?.trim()) { doc.privacyTitleFr = PRIVACY_TITLE_FR; dirty = true; }
    if (!doc.privacyBodyEn?.trim()) { doc.privacyBodyEn = doc.privacyBody || PRIVACY_BODY_EN; dirty = true; }
    if (!doc.privacyBodyFr?.trim()) { doc.privacyBodyFr = PRIVACY_BODY_FR; dirty = true; }
    if (!doc.privacyTitle?.trim()) { doc.privacyTitle = doc.privacyTitleEn || PRIVACY_TITLE_EN; dirty = true; }
    if (!doc.privacyBody?.trim()) { doc.privacyBody = doc.privacyBodyEn || PRIVACY_BODY_EN; dirty = true; }

    // Operator Terms
    if (!doc.operatorTermsTitleEn?.trim()) { doc.operatorTermsTitleEn = doc.operatorTermsTitle || OPERATOR_TERMS_TITLE_EN; dirty = true; }
    if (!doc.operatorTermsTitleFr?.trim()) { doc.operatorTermsTitleFr = OPERATOR_TERMS_TITLE_FR; dirty = true; }
    if (!doc.operatorTermsBodyEn?.trim()) { doc.operatorTermsBodyEn = doc.operatorTermsBody || OPERATOR_TERMS_BODY_EN; dirty = true; }
    if (!doc.operatorTermsBodyFr?.trim()) { doc.operatorTermsBodyFr = OPERATOR_TERMS_BODY_FR; dirty = true; }
    if (!doc.operatorTermsTitle?.trim()) { doc.operatorTermsTitle = doc.operatorTermsTitleEn || OPERATOR_TERMS_TITLE_EN; dirty = true; }
    if (!doc.operatorTermsBody?.trim()) { doc.operatorTermsBody = doc.operatorTermsBodyEn || OPERATOR_TERMS_BODY_EN; dirty = true; }

    // Operator Privacy
    if (!doc.operatorPrivacyTitleEn?.trim()) { doc.operatorPrivacyTitleEn = doc.operatorPrivacyTitle || OPERATOR_PRIVACY_TITLE_EN; dirty = true; }
    if (!doc.operatorPrivacyTitleFr?.trim()) { doc.operatorPrivacyTitleFr = OPERATOR_PRIVACY_TITLE_FR; dirty = true; }
    if (!doc.operatorPrivacyBodyEn?.trim()) { doc.operatorPrivacyBodyEn = doc.operatorPrivacyBody || OPERATOR_PRIVACY_BODY_EN; dirty = true; }
    if (!doc.operatorPrivacyBodyFr?.trim()) { doc.operatorPrivacyBodyFr = OPERATOR_PRIVACY_BODY_FR; dirty = true; }
    if (!doc.operatorPrivacyTitle?.trim()) { doc.operatorPrivacyTitle = doc.operatorPrivacyTitleEn || OPERATOR_PRIVACY_TITLE_EN; dirty = true; }
    if (!doc.operatorPrivacyBody?.trim()) { doc.operatorPrivacyBody = doc.operatorPrivacyBodyEn || OPERATOR_PRIVACY_BODY_EN; dirty = true; }

    // FAQs
    if (!Array.isArray(doc.faqs) || doc.faqs.length === 0) {
      doc.faqs = FAQ_DEFAULTS;
      dirty = true;
    } else {
      // Ensure existing FAQs have both EN and FR
      doc.faqs = doc.faqs.map((f, idx) => {
        const fallback = FAQ_DEFAULTS[idx] || {};
        return {
          questionEn: f.questionEn || f.question || fallback.questionEn || '',
          answerEn: f.answerEn || f.answer || fallback.answerEn || '',
          questionFr: f.questionFr || fallback.questionFr || f.question || '',
          answerFr: f.answerFr || fallback.answerFr || f.answer || '',
          question: f.question || f.questionEn || fallback.question || '',
          answer: f.answer || f.answerEn || fallback.answer || '',
        };
      });
      dirty = true;
    }

    // Operator FAQs
    if (!Array.isArray(doc.operatorFaqs) || doc.operatorFaqs.length === 0) {
      doc.operatorFaqs = OPERATOR_FAQ_DEFAULTS;
      dirty = true;
    } else {
      doc.operatorFaqs = doc.operatorFaqs.map((f, idx) => {
        const fallback = OPERATOR_FAQ_DEFAULTS[idx] || {};
        return {
          questionEn: f.questionEn || f.question || fallback.questionEn || '',
          answerEn: f.answerEn || f.answer || fallback.answerEn || '',
          questionFr: f.questionFr || fallback.questionFr || f.question || '',
          answerFr: f.answerFr || fallback.answerFr || f.answer || '',
          question: f.question || f.questionEn || fallback.question || '',
          answer: f.answer || f.answerEn || fallback.answer || '',
        };
      });
      dirty = true;
    }

    if (dirty) await doc.save();
  }
  return doc;
};

const toPayload = (doc, lang = null) => {
  const isFr = String(lang).toLowerCase() === 'fr';

  return {
    id: String(doc._id),

    // Terms
    termsTitleEn: doc.termsTitleEn || doc.termsTitle || TERMS_TITLE_EN,
    termsTitleFr: doc.termsTitleFr || TERMS_TITLE_FR,
    termsTitle: isFr ? (doc.termsTitleFr || doc.termsTitleEn || doc.termsTitle) : (doc.termsTitleEn || doc.termsTitle),
    termsBodyEn: doc.termsBodyEn || doc.termsBody || TERMS_BODY_EN,
    termsBodyFr: doc.termsBodyFr || TERMS_BODY_FR,
    termsBody: isFr ? (doc.termsBodyFr || doc.termsBodyEn || doc.termsBody) : (doc.termsBodyEn || doc.termsBody),

    // Privacy
    privacyTitleEn: doc.privacyTitleEn || doc.privacyTitle || PRIVACY_TITLE_EN,
    privacyTitleFr: doc.privacyTitleFr || PRIVACY_TITLE_FR,
    privacyTitle: isFr ? (doc.privacyTitleFr || doc.privacyTitleEn || doc.privacyTitle) : (doc.privacyTitleEn || doc.privacyTitle),
    privacyBodyEn: doc.privacyBodyEn || doc.privacyBody || PRIVACY_BODY_EN,
    privacyBodyFr: doc.privacyBodyFr || PRIVACY_BODY_FR,
    privacyBody: isFr ? (doc.privacyBodyFr || doc.privacyBodyEn || doc.privacyBody) : (doc.privacyBodyEn || doc.privacyBody),

    // Operator Terms
    operatorTermsTitleEn: doc.operatorTermsTitleEn || doc.operatorTermsTitle || OPERATOR_TERMS_TITLE_EN,
    operatorTermsTitleFr: doc.operatorTermsTitleFr || OPERATOR_TERMS_TITLE_FR,
    operatorTermsTitle: isFr ? (doc.operatorTermsTitleFr || doc.operatorTermsTitleEn || doc.operatorTermsTitle) : (doc.operatorTermsTitleEn || doc.operatorTermsTitle),
    operatorTermsBodyEn: doc.operatorTermsBodyEn || doc.operatorTermsBody || OPERATOR_TERMS_BODY_EN,
    operatorTermsBodyFr: doc.operatorTermsBodyFr || OPERATOR_TERMS_BODY_FR,
    operatorTermsBody: isFr ? (doc.operatorTermsBodyFr || doc.operatorTermsBodyEn || doc.operatorTermsBody) : (doc.operatorTermsBodyEn || doc.operatorTermsBody),

    // Operator Privacy
    operatorPrivacyTitleEn: doc.operatorPrivacyTitleEn || doc.operatorPrivacyTitle || OPERATOR_PRIVACY_TITLE_EN,
    operatorPrivacyTitleFr: doc.operatorPrivacyTitleFr || OPERATOR_PRIVACY_TITLE_FR,
    operatorPrivacyTitle: isFr ? (doc.operatorPrivacyTitleFr || doc.operatorPrivacyTitleEn || doc.operatorPrivacyTitle) : (doc.operatorPrivacyTitleEn || doc.operatorPrivacyTitle),
    operatorPrivacyBodyEn: doc.operatorPrivacyBodyEn || doc.operatorPrivacyBody || OPERATOR_PRIVACY_BODY_EN,
    operatorPrivacyBodyFr: doc.operatorPrivacyBodyFr || OPERATOR_PRIVACY_BODY_FR,
    operatorPrivacyBody: isFr ? (doc.operatorPrivacyBodyFr || doc.operatorPrivacyBodyEn || doc.operatorPrivacyBody) : (doc.operatorPrivacyBodyEn || doc.operatorPrivacyBody),

    // FAQs
    faqs: (doc.faqs || []).map((f) => ({
      questionEn: f.questionEn || f.question || '',
      answerEn: f.answerEn || f.answer || '',
      questionFr: f.questionFr || f.questionEn || f.question || '',
      answerFr: f.answerFr || f.answerEn || f.answer || '',
      question: isFr ? (f.questionFr || f.questionEn || f.question) : (f.questionEn || f.question),
      answer: isFr ? (f.answerFr || f.answerEn || f.answer) : (f.answerEn || f.answer),
    })),

    // Operator FAQs
    operatorFaqs: (doc.operatorFaqs || []).map((f) => ({
      questionEn: f.questionEn || f.question || '',
      answerEn: f.answerEn || f.answer || '',
      questionFr: f.questionFr || f.questionEn || f.question || '',
      answerFr: f.answerFr || f.answerEn || f.answer || '',
      question: isFr ? (f.questionFr || f.questionEn || f.question) : (f.questionEn || f.question),
      answer: isFr ? (f.answerFr || f.answerEn || f.answer) : (f.answerEn || f.answer),
    })),

    updatedAt: doc.updatedAt,
  };
};

module.exports = {
  getPublicContent: async (req, res) => {
    try {
      const lang = req.query?.lang || req.headers['accept-language'] || req.headers['x-language'];
      const doc = await ensureContent(req);
      return response.ok(res, { content: toPayload(doc, lang) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getContent: async (req, res) => {
    try {
      const lang = req.query?.lang || req.headers['accept-language'] || req.headers['x-language'];
      const doc = await ensureContent(req);
      return response.ok(res, { content: toPayload(doc, lang) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateContent: async (req, res) => {
    try {
      const {
        termsTitleEn,
        termsTitleFr,
        termsTitle,
        termsBodyEn,
        termsBodyFr,
        termsBody,

        privacyTitleEn,
        privacyTitleFr,
        privacyTitle,
        privacyBodyEn,
        privacyBodyFr,
        privacyBody,

        operatorTermsTitleEn,
        operatorTermsTitleFr,
        operatorTermsTitle,
        operatorTermsBodyEn,
        operatorTermsBodyFr,
        operatorTermsBody,

        operatorPrivacyTitleEn,
        operatorPrivacyTitleFr,
        operatorPrivacyTitle,
        operatorPrivacyBodyEn,
        operatorPrivacyBodyFr,
        operatorPrivacyBody,

        faqs,
        operatorFaqs,
      } = req.body;

      const update = {};

      // Terms
      if (termsTitleEn !== undefined) update.termsTitleEn = String(termsTitleEn).trim();
      if (termsTitleFr !== undefined) update.termsTitleFr = String(termsTitleFr).trim();
      if (termsTitle !== undefined) {
        update.termsTitle = String(termsTitle).trim();
        if (!update.termsTitleEn) update.termsTitleEn = update.termsTitle;
      }
      if (termsBodyEn !== undefined) update.termsBodyEn = String(termsBodyEn);
      if (termsBodyFr !== undefined) update.termsBodyFr = String(termsBodyFr);
      if (termsBody !== undefined) {
        update.termsBody = String(termsBody);
        if (!update.termsBodyEn) update.termsBodyEn = update.termsBody;
      }

      // Privacy
      if (privacyTitleEn !== undefined) update.privacyTitleEn = String(privacyTitleEn).trim();
      if (privacyTitleFr !== undefined) update.privacyTitleFr = String(privacyTitleFr).trim();
      if (privacyTitle !== undefined) {
        update.privacyTitle = String(privacyTitle).trim();
        if (!update.privacyTitleEn) update.privacyTitleEn = update.privacyTitle;
      }
      if (privacyBodyEn !== undefined) update.privacyBodyEn = String(privacyBodyEn);
      if (privacyBodyFr !== undefined) update.privacyBodyFr = String(privacyBodyFr);
      if (privacyBody !== undefined) {
        update.privacyBody = String(privacyBody);
        if (!update.privacyBodyEn) update.privacyBodyEn = update.privacyBody;
      }

      // Operator Terms
      if (operatorTermsTitleEn !== undefined) update.operatorTermsTitleEn = String(operatorTermsTitleEn).trim();
      if (operatorTermsTitleFr !== undefined) update.operatorTermsTitleFr = String(operatorTermsTitleFr).trim();
      if (operatorTermsTitle !== undefined) {
        update.operatorTermsTitle = String(operatorTermsTitle).trim();
        if (!update.operatorTermsTitleEn) update.operatorTermsTitleEn = update.operatorTermsTitle;
      }
      if (operatorTermsBodyEn !== undefined) update.operatorTermsBodyEn = String(operatorTermsBodyEn);
      if (operatorTermsBodyFr !== undefined) update.operatorTermsBodyFr = String(operatorTermsBodyFr);
      if (operatorTermsBody !== undefined) {
        update.operatorTermsBody = String(operatorTermsBody);
        if (!update.operatorTermsBodyEn) update.operatorTermsBodyEn = update.operatorTermsBody;
      }

      // Operator Privacy
      if (operatorPrivacyTitleEn !== undefined) update.operatorPrivacyTitleEn = String(operatorPrivacyTitleEn).trim();
      if (operatorPrivacyTitleFr !== undefined) update.operatorPrivacyTitleFr = String(operatorPrivacyTitleFr).trim();
      if (operatorPrivacyTitle !== undefined) {
        update.operatorPrivacyTitle = String(operatorPrivacyTitle).trim();
        if (!update.operatorPrivacyTitleEn) update.operatorPrivacyTitleEn = update.operatorPrivacyTitle;
      }
      if (operatorPrivacyBodyEn !== undefined) update.operatorPrivacyBodyEn = String(operatorPrivacyBodyEn);
      if (operatorPrivacyBodyFr !== undefined) update.operatorPrivacyBodyFr = String(operatorPrivacyBodyFr);
      if (operatorPrivacyBody !== undefined) {
        update.operatorPrivacyBody = String(operatorPrivacyBody);
        if (!update.operatorPrivacyBodyEn) update.operatorPrivacyBodyEn = update.operatorPrivacyBody;
      }

      // FAQs
      if (faqs !== undefined) {
        const cleaned = normalizeFaqs(faqs);
        if (!cleaned) {
          return response.badReq(res, { message: 'faqs must be an array of questions and answers' });
        }
        update.faqs = cleaned;
      }
      if (operatorFaqs !== undefined) {
        const cleanedOp = normalizeFaqs(operatorFaqs);
        if (!cleanedOp) {
          return response.badReq(res, { message: 'operatorFaqs must be an array of questions and answers' });
        }
        update.operatorFaqs = cleanedOp;
      }

      let doc = await AppContent.findOne(tenantFilter(req));
      if (!doc) {
        doc = await AppContent.create({
          ...APP_CONTENT_DEFAULT,
          ...update,
          ...(req?.apiUser?._id ? { api_user: req.apiUser._id } : {}),
        });
      } else {
        doc = await AppContent.findByIdAndUpdate(doc._id, update, {
          new: true,
          runValidators: true,
        });
      }

      return response.ok(res, {
        message: 'Content updated successfully',
        content: toPayload(doc),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
