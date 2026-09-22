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
  commissionRate: doc.commissionRate != null ? Number(doc.commissionRate) : 5,
  taxRate: doc.taxRate != null ? Number(doc.taxRate) : 0,
  serviceFee: doc.serviceFee != null ? Number(doc.serviceFee) : 0,
  notifyBookings: !!doc.notifyBookings,
  notifyUsers: !!doc.notifyUsers,
  maintenanceMode: !!doc.maintenanceMode,
  maintenanceTitleEn: doc.maintenanceTitleEn || 'Under Maintenance',
  maintenanceMessageEn: doc.maintenanceMessageEn || "Alagare is currently undergoing scheduled maintenance. We'll be back shortly!",
  maintenanceTitleFr: doc.maintenanceTitleFr || 'Maintenance en cours',
  maintenanceMessageFr: doc.maintenanceMessageFr || 'Alagare est actuellement en maintenance planifiée. Nous serons bientôt de retour !',
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
          commissionRate: doc.commissionRate != null ? Number(doc.commissionRate) : 5,
          taxRate: doc.taxRate != null ? Number(doc.taxRate) : 0,
          serviceFee: doc.serviceFee != null ? Number(doc.serviceFee) : 0,
          maintenanceMode: !!doc.maintenanceMode,
          maintenanceTitleEn: doc.maintenanceTitleEn || 'Under Maintenance',
          maintenanceMessageEn: doc.maintenanceMessageEn || "Alagare is currently undergoing scheduled maintenance. We'll be back shortly!",
          maintenanceTitleFr: doc.maintenanceTitleFr || 'Maintenance en cours',
          maintenanceMessageFr: doc.maintenanceMessageFr || 'Alagare est actuellement en maintenance planifiée. Nous serons bientôt de retour !',
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getMaintenanceStatus: async (req, res) => {
    try {
      const doc = await ensureSettings(req);
      return response.ok(res, {
        maintenance: {
          enabled: !!doc.maintenanceMode,
          titleEn: doc.maintenanceTitleEn || 'Under Maintenance',
          messageEn: doc.maintenanceMessageEn || "Alagare is currently undergoing scheduled maintenance. We'll be back shortly!",
          titleFr: doc.maintenanceTitleFr || 'Maintenance en cours',
          messageFr: doc.maintenanceMessageFr || 'Alagare est actuellement en maintenance planifiée. Nous serons bientôt de retour !',
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
        commissionRate,
        taxRate,
        serviceFee,
        notifyBookings,
        notifyUsers,
        maintenanceMode,
        maintenanceTitleEn,
        maintenanceMessageEn,
        maintenanceTitleFr,
        maintenanceMessageFr,
      } = req.body;

      const update = {};
      if (platformName !== undefined) update.platformName = String(platformName).trim();
      if (supportEmail !== undefined) update.supportEmail = String(supportEmail).trim();
      if (commissionRate !== undefined) {
        if (commissionRate === '' || commissionRate === null || isNaN(commissionRate)) {
          update.commissionRate = 0;
        } else {
          update.commissionRate = Math.max(0, Number(commissionRate));
        }
      }
      if (taxRate !== undefined) {
        if (taxRate === '' || taxRate === null || isNaN(taxRate)) {
          update.taxRate = 0;
        } else {
          update.taxRate = Math.max(0, Number(taxRate));
        }
      }
      if (serviceFee !== undefined) {
        if (serviceFee === '' || serviceFee === null || isNaN(serviceFee)) {
          update.serviceFee = 0;
        } else {
          update.serviceFee = Math.max(0, Number(serviceFee));
        }
      }
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
      if (maintenanceTitleEn !== undefined) update.maintenanceTitleEn = String(maintenanceTitleEn).trim();
      if (maintenanceMessageEn !== undefined) update.maintenanceMessageEn = String(maintenanceMessageEn).trim();
      if (maintenanceTitleFr !== undefined) update.maintenanceTitleFr = String(maintenanceTitleFr).trim();
      if (maintenanceMessageFr !== undefined) update.maintenanceMessageFr = String(maintenanceMessageFr).trim();

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
