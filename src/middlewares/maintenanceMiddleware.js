'use strict';
const PlatformSettings = require('@models/PlatformSettings');

const maintenanceMiddleware = async (req, res, next) => {
  try {
    const path = (req.originalUrl || req.path || req.url || '').toLowerCase();
    // Exclude setup, health, status endpoints, operator and admin operations
    if (
      path.startsWith('/setup') ||
      path.includes('/setup') ||
      path.startsWith('/admin') ||
      path.includes('/admin') ||
      path.includes('/api/admin') ||
      path.includes('/admin-bus') ||
      path.includes('/admin-ops') ||
      path.includes('/api-users') ||
      path.includes('/operator') ||
      path.includes('/maintenance-status') ||
      path.includes('/public-settings') ||
      path === '/' ||
      path === '/health' ||
      path.includes('/health')
    ) {
      return next();
    }

    if (!req.apiUser?._id) {
      return next();
    }

    const settings = await PlatformSettings.findOne({ api_user: req.apiUser._id });
    if (settings && settings.maintenanceMode === true) {
      return res.status(503).json({
        status: false,
        maintenance: true,
        message: "Application is currently under maintenance / L'application est actuellement en maintenance",
        data: {
          maintenance: true,
          titleEn: settings.maintenanceTitleEn || 'Under Maintenance',
          messageEn: settings.maintenanceMessageEn || "Alagare is currently undergoing scheduled maintenance. We'll be back shortly!",
          titleFr: settings.maintenanceTitleFr || 'Maintenance en cours',
          messageFr: settings.maintenanceMessageFr || "Alagare est actuellement en maintenance planifiée. Nous serons bientôt de retour !",
        },
      });
    }

    return next();
  } catch (err) {
    return next();
  }
};

module.exports = maintenanceMiddleware;
