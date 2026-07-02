'use strict';
const ApiPartner = require('@models/ApiPartner');
const response = require('@responses');
const { generateApiKey } = require('../helper/apiKey');

module.exports = {
  /** Admin: create a new API partner (returns raw key once) */
  createPartner: async (req, res) => {
    try {
      const { companyName, contactEmail, permissions, webhookUrl } = req.body;

      if (!companyName || !contactEmail) {
        return response.badReq(res, { message: 'companyName and contactEmail are required' });
      }

      const { rawKey, apiKeyHash, keyPrefix } = generateApiKey();

      const partner = await ApiPartner.create({
        companyName,
        contactEmail,
        apiKeyHash,
        keyPrefix,
        permissions: permissions || undefined,
        webhookUrl,
      });

      return response.created(res, {
        message: 'API partner created. Store the API key securely — it will not be shown again.',
        partner: {
          id: partner._id,
          companyName: partner.companyName,
          contactEmail: partner.contactEmail,
          keyPrefix: partner.keyPrefix,
          permissions: partner.permissions,
          isActive: partner.isActive,
        },
        apiKey: rawKey,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  /** Admin: list all partners (no raw keys) */
  listPartners: async (req, res) => {
    try {
      const partners = await ApiPartner.find()
        .select('-apiKeyHash')
        .sort({ createdAt: -1 });

      return response.ok(res, { partners });
    } catch (error) {
      return response.error(res, error);
    }
  },

  /** Admin: activate/deactivate partner */
  togglePartner: async (req, res) => {
    try {
      const { partnerId, isActive } = req.body;
      if (!partnerId || typeof isActive !== 'boolean') {
        return response.badReq(res, { message: 'partnerId and isActive (boolean) are required' });
      }

      const partner = await ApiPartner.findByIdAndUpdate(
        partnerId,
        { isActive },
        { new: true },
      ).select('-apiKeyHash');

      if (!partner) {
        return response.notFound(res, { message: 'Partner not found' });
      }

      return response.ok(res, {
        message: `Partner ${isActive ? 'activated' : 'deactivated'}`,
        partner,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
