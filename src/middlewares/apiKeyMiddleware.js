'use strict';
const crypto = require('crypto');
const ApiUser = require('@models/ApiUser');
const response = require('@responses');


const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    // ── DEBUG ──────────────────────────────────────────────────────────────
    console.log('\n[apiKeyAuth] >>>>', req.method, req.path);
    console.log('[apiKeyAuth] x-api-key header:', apiKey ? `"${String(apiKey).slice(0, 30)}..."` : 'MISSING');
    // ───────────────────────────────────────────────────────────────────────

    if (!apiKey) {
      console.log('[apiKeyAuth] FAIL — no x-api-key header sent');
      return response.unAuthorize(res, { message: 'API key is required' });
    }

    const [id, signature] = String(apiKey).split('.');

    console.log('[apiKeyAuth] parsed id:', id);
    console.log('[apiKeyAuth] parsed signature (first 12):', signature ? signature.slice(0, 12) + '...' : 'MISSING');

    if (!id || !signature) {
      console.log('[apiKeyAuth] FAIL — key format invalid (no dot separator?)');
      return response.unAuthorize(res, { message: 'Invalid API key format' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(id)
      .digest('hex');

    console.log('[apiKeyAuth] expected sig (first 12):', expectedSignature.slice(0, 12) + '...');
    console.log('[apiKeyAuth] signatures match:', signature === expectedSignature);

    if (signature !== expectedSignature) {
      console.log('[apiKeyAuth] FAIL — signature mismatch. JWT_SECRET may differ from when key was generated.');
      return response.unAuthorize(res, { message: 'Invalid API key' });
    }

    const apiUser = await ApiUser.findById(id);

    console.log('[apiKeyAuth] ApiUser found:', apiUser ? `yes (active=${apiUser.is_active})` : 'NO — not in DB');

    if (!apiUser || !apiUser.is_active) {
      return response.unAuthorize(res, { message: 'Invalid API key' });
    }

    console.log('[apiKeyAuth] expiry_date:', apiUser.expiry_date);
    console.log('[apiKeyAuth] expired:', new Date() > new Date(apiUser.expiry_date));

    if (new Date() > new Date(apiUser.expiry_date)) {
      return response.unAuthorize(res, { message: 'API key has expired' });
    }

    console.log('[apiKeyAuth] ✅ PASS — proceeding');
    req.apiUser = apiUser;
    return next();
  } catch (error) {
    console.log('[apiKeyAuth] EXCEPTION:', error.message);
    return response.unAuthorize(res, { message: 'Invalid API key' });
  }
};

module.exports = apiKeyAuth;
