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
    termsTitleEn: doc.termsTitleEn || doc.termsTitle || 'Terms of Service',
    termsTitleFr: doc.termsTitleFr || "Conditions Générales d'Utilisation",
    termsTitle: doc.termsTitle || doc.termsTitleEn || 'Terms of Service',
    termsBodyEn: doc.termsBodyEn || doc.termsBody || '',
    termsBodyFr: doc.termsBodyFr || '',
    termsBody: doc.termsBody || doc.termsBodyEn || '',

    privacyTitleEn: doc.privacyTitleEn || doc.privacyTitle || 'Privacy Policy',
    privacyTitleFr: doc.privacyTitleFr || 'Politique de Confidentialité',
    privacyTitle: doc.privacyTitle || doc.privacyTitleEn || 'Privacy Policy',
    privacyBodyEn: doc.privacyBodyEn || doc.privacyBody || '',
    privacyBodyFr: doc.privacyBodyFr || '',
    privacyBody: doc.privacyBody || doc.privacyBodyEn || '',

    faqs: (doc.faqs || []).map((f) => ({
      questionEn: f.questionEn || f.question || '',
      answerEn: f.answerEn || f.answer || '',
      questionFr: f.questionFr || f.question || '',
      answerFr: f.answerFr || f.answer || '',
      question: f.question || f.questionEn || '',
      answer: f.answer || f.answerEn || '',
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
      const PlatformSettings = require('@models/PlatformSettings');
      const settings = await PlatformSettings.findOne({ api_user: apiUser._id });

      const maintenance = {
        enabled: !!settings?.maintenanceMode,
        titleEn: settings?.maintenanceTitleEn || 'Under Maintenance',
        messageEn: settings?.maintenanceMessageEn || "Alagare is currently undergoing scheduled maintenance. We'll be back shortly!",
        titleFr: settings?.maintenanceTitleFr || 'Maintenance en cours',
        messageFr: settings?.maintenanceMessageFr || 'Alagare est actuellement en maintenance planifiée. Nous serons bientôt de retour !',
      };

      return response.ok(res, {
        message: 'Application setup loaded',
        appName: apiUser.app_name,
        apiKey: apiUser.api_key,
        keys: buildClientKeys(apiUser),
        content,
        maintenance,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
