'use strict';
const ApiUser = require('@models/ApiUser');
const { DEFAULT_GOOGLE_MAPS_KEY } = require('@lib/clientKeys');

const DEFAULT_APP_NAME = 'alagare-mobile';

async function seedDefaultApiUser() {
  let apiUser = await ApiUser.findOne({ email: 'mobile@alagare.com' });

  if (!apiUser) {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 10);

    apiUser = new ApiUser({
      first_name: 'Alagare',
      last_name: 'Mobile',
      email: 'mobile@alagare.com',
      app_name: DEFAULT_APP_NAME,
      expiry_date: expiry,
      is_active: true,
      client_keys: { googleMaps: DEFAULT_GOOGLE_MAPS_KEY },
    });
    await apiUser.save();
    apiUser.api_key = apiUser.generateApiKey();
    await apiUser.save();
    console.log('Default ApiUser seeded');
  } else {
    let dirty = false;

    // Always verify stored key signature matches current JWT_SECRET.
    // If mismatch (e.g. JWT_SECRET changed), regenerate.
    if (apiUser.api_key) {
      const crypto = require('crypto');
      const [storedId, storedSig] = String(apiUser.api_key).split('.');
      const expectedSig = crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(storedId || '')
        .digest('hex');
      if (storedSig !== expectedSig) {
        console.log('[seedApiUser] API key signature mismatch — regenerating with current JWT_SECRET');
        apiUser.api_key = apiUser.generateApiKey();
        dirty = true;
      }
    } else {
      apiUser.api_key = apiUser.generateApiKey();
      dirty = true;
    }

    if (!apiUser.app_name) {
      apiUser.app_name = DEFAULT_APP_NAME;
      dirty = true;
    }
    if (!apiUser.client_keys?.googleMaps) {
      apiUser.client_keys = {
        ...(apiUser.client_keys?.toObject?.() || apiUser.client_keys || {}),
        googleMaps: DEFAULT_GOOGLE_MAPS_KEY,
      };
      dirty = true;
    }
    if (dirty) await apiUser.save();
  }

  console.log('────────────────────────────────────────');
  console.log(`App setup name: ${apiUser.app_name || DEFAULT_APP_NAME}`);
  console.log('Alagare X-API-Key (admin / bootstrap):');
  console.log(apiUser.api_key);
  console.log('────────────────────────────────────────');

  return apiUser;
}

module.exports = { seedDefaultApiUser };
