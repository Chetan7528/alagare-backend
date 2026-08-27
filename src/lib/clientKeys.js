'use strict';

function buildClientKeys(apiUser) {
  const envKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  const stored = apiUser?.client_keys || {};
  return {
    googleMaps: stored.googleMaps || envKey,
  };
}

module.exports = { buildClientKeys };
