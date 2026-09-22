'use strict';

const PLATFORM_SETTINGS_DEFAULT = {
  platformName: 'Alagare',
  supportEmail: 'support@alagare.com',
  currency: 'EUR',
  timezone: 'Europe/Berlin',
  commissionRate: 5,
  taxRate: 0,
  notifyBookings: true,
  notifyUsers: true,
  maintenanceMode: false,
  maintenanceTitleEn: 'Under Maintenance',
  maintenanceMessageEn: "Alagare is currently undergoing scheduled maintenance. We'll be back shortly!",
  maintenanceTitleFr: 'Maintenance en cours',
  maintenanceMessageFr: 'Alagare est actuellement en maintenance planifiée. Nous serons bientôt de retour !',
};

const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  INR: '₹',
};

module.exports = { PLATFORM_SETTINGS_DEFAULT, CURRENCY_SYMBOLS };
