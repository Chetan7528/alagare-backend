'use strict';
const AppContent = require('@models/AppContent');
const response = require('@responses');
const { APP_CONTENT_DEFAULT, FAQ_DEFAULTS } = require('@lib/appContentDefaults');

const tenantFilter = (req) => ({ api_user: req.apiUser._id });

const normalizeFaqs = (faqs) => {
  if (!Array.isArray(faqs)) return null;
  return faqs
    .map((f) => ({
      question: String(f?.question || '').trim(),
      answer: String(f?.answer || '').trim(),
    }))
    .filter((f) => f.question && f.answer);
};

const ensureContent = async (req) => {
  let doc = await AppContent.findOne(tenantFilter(req));
  if (!doc) {
    doc = await AppContent.create({
      ...APP_CONTENT_DEFAULT,
      api_user: req.apiUser._id,
    });
  } else {
    let dirty = false;
    if (!doc.termsBody?.trim()) {
      doc.termsBody = APP_CONTENT_DEFAULT.termsBody;
      dirty = true;
    }
    if (!doc.privacyBody?.trim()) {
      doc.privacyBody = APP_CONTENT_DEFAULT.privacyBody;
      dirty = true;
    }
    if (!doc.termsTitle?.trim()) {
      doc.termsTitle = APP_CONTENT_DEFAULT.termsTitle;
      dirty = true;
    }
    if (!doc.privacyTitle?.trim()) {
      doc.privacyTitle = APP_CONTENT_DEFAULT.privacyTitle;
      dirty = true;
    }
    if (!Array.isArray(doc.faqs) || doc.faqs.length === 0) {
      doc.faqs = FAQ_DEFAULTS;
      dirty = true;
    }
    if (dirty) await doc.save();
  }
  return doc;
};

const toPayload = (doc) => ({
  id: String(doc._id),
  termsTitle: doc.termsTitle,
  termsBody: doc.termsBody,
  privacyTitle: doc.privacyTitle,
  privacyBody: doc.privacyBody,
  faqs: (doc.faqs || []).map((f) => ({
    question: f.question,
    answer: f.answer,
  })),
  updatedAt: doc.updatedAt,
});

module.exports = {
  /** Mobile — X-API-Key only (Sign Up / Help) */
  getPublicContent: async (req, res) => {
    try {
      const doc = await ensureContent(req);
      return response.ok(res, { content: toPayload(doc) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getContent: async (req, res) => {
    try {
      const doc = await ensureContent(req);
      return response.ok(res, { content: toPayload(doc) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateContent: async (req, res) => {
    try {
      const { termsTitle, termsBody, privacyTitle, privacyBody, faqs } = req.body;
      const update = {};
      if (termsTitle !== undefined) update.termsTitle = String(termsTitle).trim();
      if (termsBody !== undefined) update.termsBody = String(termsBody);
      if (privacyTitle !== undefined) update.privacyTitle = String(privacyTitle).trim();
      if (privacyBody !== undefined) update.privacyBody = String(privacyBody);
      if (faqs !== undefined) {
        const cleaned = normalizeFaqs(faqs);
        if (!cleaned) {
          return response.badReq(res, { message: 'faqs must be an array of question/answer' });
        }
        update.faqs = cleaned;
      }

      let doc = await AppContent.findOne(tenantFilter(req));
      if (!doc) {
        doc = await AppContent.create({
          ...APP_CONTENT_DEFAULT,
          ...update,
          api_user: req.apiUser._id,
        });
      } else {
        doc = await AppContent.findByIdAndUpdate(doc._id, update, {
          new: true,
          runValidators: true,
        });
      }

      return response.ok(res, {
        message: 'Content updated',
        content: toPayload(doc),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
