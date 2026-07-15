'use strict';
const PlatformSettings = require('@models/PlatformSettings');
const response = require('@responses');
const {
  PLATFORM_SETTINGS_DEFAULT,
  CURRENCY_SYMBOLS,
} = require('@lib/platformSettingsDefaults');

const tenantFilter = (req) => ({ api_user: req.apiUser._id });

const toPayload = (doc) => ({
  id: String(doc._id),
  platformName: doc.platformName,
  supportEmail: doc.supportEmail,
  currency: doc.currency,
  currencySymbol: CURRENCY_SYMBOLS[doc.currency] || doc.currency,
  timezone: doc.timezone,
  notifyBookings: !!doc.notifyBookings,
  notifyUsers: !!doc.notifyUsers,
  maintenanceMode: !!doc.maintenanceMode,
  updatedAt: doc.updatedAt,
});

const ensureSettings = async (req) => {
  let doc = await PlatformSettings.findOne(tenantFilter(req));
  if (!doc) {
    doc = await PlatformSettings.create({
      ...PLATFORM_SETTINGS_DEFAULT,
      api_user: req.apiUser._id,
    });
  }
  return doc;
};

module.exports = {
  getSettings: async (req, res) => {
    try {
      const doc = await ensureSettings(req);
      return response.ok(res, { settings: toPayload(doc) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  /** Mobile / public — X-API-Key only */
  getPublicSettings: async (req, res) => {
    try {
      const doc = await ensureSettings(req);
      return response.ok(res, {
        settings: {
          platformName: doc.platformName,
          supportEmail: doc.supportEmail,
          currency: doc.currency,
          currencySymbol: CURRENCY_SYMBOLS[doc.currency] || doc.currency,
          timezone: doc.timezone,
          maintenanceMode: !!doc.maintenanceMode,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateSettings: async (req, res) => {
    try {
      const {
        platformName,
        supportEmail,
        currency,
        timezone,
        notifyBookings,
        notifyUsers,
        maintenanceMode,
      } = req.body;

      const update = {};
      if (platformName !== undefined) update.platformName = String(platformName).trim();
      if (supportEmail !== undefined) update.supportEmail = String(supportEmail).trim();
      if (currency !== undefined) {
        const allowed = ['EUR', 'USD', 'GBP', 'INR'];
        if (!allowed.includes(currency)) {
          return response.badReq(res, { message: 'Invalid currency' });
        }
        update.currency = currency;
      }
      if (timezone !== undefined) update.timezone = String(timezone).trim();
      if (notifyBookings !== undefined) update.notifyBookings = !!notifyBookings;
      if (notifyUsers !== undefined) update.notifyUsers = !!notifyUsers;
      if (maintenanceMode !== undefined) update.maintenanceMode = !!maintenanceMode;

      let doc = await PlatformSettings.findOne(tenantFilter(req));
      if (!doc) {
        doc = await PlatformSettings.create({
          ...PLATFORM_SETTINGS_DEFAULT,
          ...update,
          api_user: req.apiUser._id,
        });
      } else {
        doc = await PlatformSettings.findByIdAndUpdate(doc._id, update, {
          new: true,
          runValidators: true,
        });
      }

      return response.ok(res, {
        message: 'Settings saved',
        settings: toPayload(doc),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
