'use strict';
const crypto = require('crypto');
const ApiUser = require('@models/ApiUser');
const response = require('@responses');


const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return response.unAuthorize(res, { message: 'API key is required' });
    }

    const [id, signature] = String(apiKey).split('.');

    if (!id || !signature) {
      return response.unAuthorize(res, { message: 'Invalid API key format' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(id)
      .digest('hex');

    if (signature !== expectedSignature) {
      return response.unAuthorize(res, { message: 'Invalid API key' });
    }

    const apiUser = await ApiUser.findById(id);

    if (!apiUser || !apiUser.is_active) {
      return response.unAuthorize(res, { message: 'Invalid API key' });
    }

    if (new Date() > new Date(apiUser.expiry_date)) {
      return response.unAuthorize(res, { message: 'API key has expired' });
    }

    req.apiUser = apiUser;
    return next();
  } catch (error) {
    return response.unAuthorize(res, { message: 'Invalid API key' });
  }
};

module.exports = apiKeyAuth;
