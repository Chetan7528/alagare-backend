'use strict';
const crypto = require('crypto');

const generateApiKey = () => {
  const rawKey = `alg_live_${crypto.randomBytes(24).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 16);
  return { rawKey, apiKeyHash, keyPrefix };
};

const hashApiKey = (rawKey) => {
  return crypto.createHash('sha256').update(String(rawKey)).digest('hex');
};

module.exports = { generateApiKey, hashApiKey };
