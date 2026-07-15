'use strict';

const BusRoute = require('@models/BusRoute');
const HomeContent = require('@models/HomeContent');
const AppContent = require('@models/AppContent');
const PlatformSettings = require('@models/PlatformSettings');
const Operator = require('@models/Operator');
const City = require('@models/City');
const BusType = require('@models/BusType');
const ApiUser = require('@models/ApiUser');
const { ROUTE_DEFAULTS, HOME_CONTENT_DEFAULT, BUS_TYPE_DEFAULTS } = require('./busDefaults');
const { APP_CONTENT_DEFAULT } = require('./appContentDefaults');
const { PLATFORM_SETTINGS_DEFAULT } = require('./platformSettingsDefaults');

const OPERATOR_DEFAULTS = [
  {
    name: 'Alagare Express',
    contact: 'ops@alagare.com',
    phone: '+49 30 12345678',
    routes: 12,
    rating: 4.8,
    reviewCount: 1200,
    description:
      'Alagare Express provides safe, comfortable intercity travel with modern coaches, onboard Wi-Fi, and reliable schedules across Europe.',
    status: 'active',
  },
  {
    name: 'Berlin Express',
    contact: 'contact@berlinexpress.de',
    phone: '+49 30 87654321',
    routes: 8,
    rating: 4.2,
    reviewCount: 860,
    description:
      'Berlin Express connects major German cities with affordable fares and frequent daily departures.',
    status: 'active',
  },
  {
    name: 'FlixGo Premium',
    contact: 'partner@flixgo.com',
    phone: '+49 89 5551234',
    routes: 15,
    rating: 4.6,
    reviewCount: 2100,
    description:
      'FlixGo Premium offers luxury coaches with reclining seats, power outlets, and complimentary refreshments.',
    status: 'active',
  },
  {
    name: 'TransiHub Partner',
    contact: 'hub@transihub.com',
    phone: '+44 20 7946 0958',
    routes: 6,
    rating: 4.5,
    reviewCount: 540,
    description:
      'TransiHub Partner specializes in cross-border routes with seamless ferry connections and luggage support.',
    status: 'inactive',
  },
];

const CITY_DEFAULTS = [
  { name: 'Berlin', country: 'Germany' },
  { name: 'Munich', country: 'Germany' },
  { name: 'Hamburg', country: 'Germany' },
  { name: 'Frankfurt', country: 'Germany' },
  { name: 'Cologne', country: 'Germany' },
  { name: 'London', country: 'United Kingdom' },
  { name: 'Paris', country: 'France' },
  { name: 'Amsterdam', country: 'Netherlands' },
];

async function seedBusData() {
  const apiUser = await ApiUser.findOne({ email: 'mobile@alagare.com' });
  if (!apiUser) {
    console.warn('seedBusData: default ApiUser missing — skip');
    return;
  }

  const routeCount = await BusRoute.countDocuments({ api_user: apiUser._id });
  if (routeCount === 0) {
    await BusRoute.insertMany(
      ROUTE_DEFAULTS.map((r) => ({ ...r, api_user: apiUser._id })),
    );
    console.log(`Seeded ${ROUTE_DEFAULTS.length} bus routes for ApiUser`);
  }

  const homeExists = await HomeContent.findOne({ api_user: apiUser._id });
  if (!homeExists) {
    await HomeContent.create({ ...HOME_CONTENT_DEFAULT, api_user: apiUser._id });
    console.log('Seeded home content for ApiUser');
  }

  const contentExists = await AppContent.findOne({ api_user: apiUser._id });
  if (!contentExists) {
    await AppContent.create({ ...APP_CONTENT_DEFAULT, api_user: apiUser._id });
    console.log('Seeded Terms & Privacy content for ApiUser');
  } else {
    const patch = {};
    if (!contentExists.termsBody?.trim()) patch.termsBody = APP_CONTENT_DEFAULT.termsBody;
    else if (!String(contentExists.termsBody).includes('<')) {
      patch.termsBody = APP_CONTENT_DEFAULT.termsBody;
    }
    if (!contentExists.privacyBody?.trim()) patch.privacyBody = APP_CONTENT_DEFAULT.privacyBody;
    else if (!String(contentExists.privacyBody).includes('<')) {
      patch.privacyBody = APP_CONTENT_DEFAULT.privacyBody;
    }
    if (!contentExists.termsTitle?.trim()) patch.termsTitle = APP_CONTENT_DEFAULT.termsTitle;
    if (!contentExists.privacyTitle?.trim()) patch.privacyTitle = APP_CONTENT_DEFAULT.privacyTitle;
    if (!Array.isArray(contentExists.faqs) || contentExists.faqs.length === 0) {
      patch.faqs = APP_CONTENT_DEFAULT.faqs;
    }
    if (Object.keys(patch).length) {
      await AppContent.findByIdAndUpdate(contentExists._id, patch);
      console.log('Backfilled Terms & Privacy content');
    }
  }

  const settingsExists = await PlatformSettings.findOne({ api_user: apiUser._id });
  if (!settingsExists) {
    await PlatformSettings.create({
      ...PLATFORM_SETTINGS_DEFAULT,
      api_user: apiUser._id,
    });
    console.log('Seeded platform settings for ApiUser');
  }

  const opCount = await Operator.countDocuments({ api_user: apiUser._id });
  if (opCount === 0) {
    await Operator.insertMany(
      OPERATOR_DEFAULTS.map((o) => ({ ...o, api_user: apiUser._id })),
    );
    console.log(`Seeded ${OPERATOR_DEFAULTS.length} operators for ApiUser`);
  }

  const cityCount = await City.countDocuments({ api_user: apiUser._id });
  if (cityCount === 0) {
    await City.insertMany(
      CITY_DEFAULTS.map((c) => ({ ...c, status: 'active', api_user: apiUser._id })),
    );
    console.log(`Seeded ${CITY_DEFAULTS.length} cities for ApiUser`);
  }

  const typeCount = await BusType.countDocuments({ api_user: apiUser._id });
  if (typeCount === 0) {
    await BusType.insertMany(
      BUS_TYPE_DEFAULTS.map((t) => ({
        ...t,
        status: 'active',
        api_user: apiUser._id,
      })),
    );
    console.log(`Seeded ${BUS_TYPE_DEFAULTS.length} bus types for ApiUser`);
  } else {
    // Backfill layout on older bus types (RedBus-style inventory fields)
    for (const def of BUS_TYPE_DEFAULTS) {
      await BusType.updateOne(
        {
          api_user: apiUser._id,
          name: def.name,
          $or: [
            { rowCount: { $exists: false } },
            { seatsPerSide: { $exists: false } },
            { totalSeats: { $exists: false } },
          ],
        },
        {
          $set: {
            rowCount: def.rowCount,
            seatsPerSide: def.seatsPerSide,
            totalSeats: def.totalSeats,
          },
        },
      );
    }
  }
}

module.exports = { seedBusData };
