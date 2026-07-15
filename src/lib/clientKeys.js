'use strict';


const DEFAULT_GOOGLE_MAPS_KEY = 'AIzaSyBSJ4feXtXRl7L4BxOrMubz8fciujaMBTk';


function buildClientKeys(apiUser) {
  const stored = apiUser?.client_keys || {};
  return {
    googleMaps:
      stored.googleMaps ||
      process.env.GOOGLE_MAPS_API_KEY ||
      DEFAULT_GOOGLE_MAPS_KEY,
  };
}

module.exports = { buildClientKeys, DEFAULT_GOOGLE_MAPS_KEY };
