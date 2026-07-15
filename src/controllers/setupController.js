'use strict';
const ApiUser = require('@models/ApiUser');
const AppContent = require('@models/AppContent');
const response = require('@responses');
const { buildClientKeys } = require('@lib/clientKeys');
const { APP_CONTENT_DEFAULT } = require('@lib/appContentDefaults');

const ensureAppContent = async (apiUserId) => {
  let doc = await AppContent.findOne({ api_user: apiUserId });
  if (!doc) {
    doc = await AppContent.create({
      ...APP_CONTENT_DEFAULT,
      api_user: apiUserId,
    });
  } else if (!Array.isArray(doc.faqs) || doc.faqs.length === 0) {
    doc.faqs = APP_CONTENT_DEFAULT.faqs;
    await doc.save();
  }
  return {
    termsTitle: doc.termsTitle,
    termsBody: doc.termsBody,
    privacyTitle: doc.privacyTitle,
    privacyBody: doc.privacyBody,
    faqs: (doc.faqs || []).map((f) => ({
      question: f.question,
      answer: f.answer,
    })),
  };
};

module.exports = {
  /**
   * Public bootstrap — no X-API-Key required.
   * App/admin call this with appSetupName (e.g. alagare-mobile) to get the tenant key.
   */
  getByAppName: async (req, res) => {
    try {
      const appName = String(req.params.appName || '')
        .trim()
        .toLowerCase();

      if (!appName) {
        return response.badReq(res, { message: 'app name is required' });
      }

      const apiUser = await ApiUser.findOne({
        app_name: appName,
        is_active: true,
      });

      if (!apiUser || !apiUser.api_key) {
        return response.notFound(res, {
          message: 'No active application setup found for this name',
        });
      }

      if (apiUser.expiry_date && new Date(apiUser.expiry_date) < new Date()) {
        return response.unAuthorize(res, {
          message: 'Application API key has expired',
        });
      }

      const content = await ensureAppContent(apiUser._id);

      return response.ok(res, {
        message: 'Application setup loaded',
        appName: apiUser.app_name,
        apiKey: apiUser.api_key,
        keys: buildClientKeys(apiUser),
        content,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
