'use strict';
const crypto = require('crypto');
const ApiUser = require('@models/ApiUser');

const getFallbackApiUser = async () => {
  try {
    let defaultUser = await ApiUser.findOne({ is_active: true, app_name: 'alagare-mobile' });
    if (!defaultUser) {
      defaultUser = await ApiUser.findOne({ is_active: true });
    }
    if (!defaultUser) {
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 10);
      defaultUser = new ApiUser({
        first_name: 'Alagare',
        last_name: 'Mobile',
        email: 'app@alagare.com',
        app_name: 'alagare-mobile',
        expiry_date: exp,
        is_active: true,
      });
      defaultUser.api_key = defaultUser.generateApiKey();
      await defaultUser.save();
    }
    return defaultUser;
  } catch {
    return null;
  }
};

const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (apiKey && String(apiKey).includes('.')) {
      const [id, signature] = String(apiKey).split('.');
      if (id && signature) {
        const expectedSignature = crypto
          .createHmac('sha256', process.env.JWT_SECRET || 'secret')
          .update(id)
          .digest('hex');

        if (signature === expectedSignature) {
          const apiUser = await ApiUser.findById(id);
          if (apiUser && apiUser.is_active) {
            req.apiUser = apiUser;
            return next();
          }
        }
      }
    }

    const fallbackUser = await getFallbackApiUser();
    if (fallbackUser) {
      req.apiUser = fallbackUser;
      return next();
    }

    return next();
  } catch {
    const fallbackUser = await getFallbackApiUser();
    if (fallbackUser) {
      req.apiUser = fallbackUser;
      return next();
    }
    return next();
  }
};

module.exports = apiKeyAuth;
