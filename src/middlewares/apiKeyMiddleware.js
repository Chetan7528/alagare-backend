'use strict';
const crypto = require('crypto');
const ApiPartner = require('@models/ApiPartner');
const response = require('@responses');

/**
 * Third-party API authentication (AdiVAH-style).
 * Partners pass: X-API-Key: alg_live_xxxx
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return response.unAuthorize(res, {
        message: 'API key required. Include header: X-API-Key',
      });
    }

    const apiKeyHash = crypto.createHash('sha256').update(String(apiKey)).digest('hex');
    const partner = await ApiPartner.findOne({ apiKeyHash, isActive: true });

    if (!partner) {
      return response.unAuthorize(res, { message: 'Invalid or inactive API key' });
    }

    partner.lastUsedAt = new Date();
    await partner.save();

    req.partner = partner;
    return next();
  } catch (error) {
    return response.error(res, error);
  }
};

module.exports = apiKeyAuth;
