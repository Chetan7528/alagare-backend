'use strict';

const PLATFORM_SETTINGS_DEFAULT = {
  platformName: 'Alagare',
  supportEmail: 'support@alagare.com',
  currency: 'EUR',
  timezone: 'Europe/Berlin',
  commissionRate: 5,
  taxRate: 0,
  serviceFee: 0,
  notifyBookings: true,
  notifyUsers: true,
  maintenanceMode: false,
};

const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  INR: '₹',
};

module.exports = { PLATFORM_SETTINGS_DEFAULT, CURRENCY_SYMBOLS };
