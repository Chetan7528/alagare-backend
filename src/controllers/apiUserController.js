'use strict';
const ApiUser = require('@models/ApiUser');
const response = require('@responses');

module.exports = {
  create: async (req, res) => {
    try {
      const { first_name, last_name, email, expiry_date, app_name, client_keys } = req.body;

      if (!first_name || !last_name || !email || !expiry_date) {
        return response.badReq(res, {
          message: 'first_name, last_name, email, and expiry_date are required',
        });
      }

      const existing = await ApiUser.findOne({ email });
      if (existing) {
        return response.conflict(res, { message: 'Email already registered' });
      }

      const payload = { first_name, last_name, email, expiry_date };
      if (app_name) {
        payload.app_name = String(app_name).trim().toLowerCase();
      }
      if (client_keys && typeof client_keys === 'object') {
        payload.client_keys = {
          googleMaps: client_keys.googleMaps || '',
        };
      }

      const apiUser = new ApiUser(payload);
      await apiUser.save();

      apiUser.api_key = apiUser.generateApiKey();
      await apiUser.save();

      return response.created(res, {
        message: 'API user created successfully',
        data: apiUser,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getAll: async (req, res) => {
    try {
      const apiUsers = await ApiUser.find().sort({ createdAt: -1 });
      return response.ok(res, { data: apiUsers });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getById: async (req, res) => {
    try {
      const apiUser = await ApiUser.findById(req.params.id);
      if (!apiUser) return response.notFound(res, { message: 'API user not found' });
      return response.ok(res, { data: apiUser });
    } catch (error) {
      return response.error(res, error);
    }
  },

  update: async (req, res) => {
    try {
      const { first_name, last_name, expiry_date, is_active, app_name, client_keys } = req.body;
      const update = { first_name, last_name, expiry_date, is_active };
      if (app_name !== undefined) {
        update.app_name = app_name
          ? String(app_name).trim().toLowerCase()
          : null;
      }
      if (client_keys && typeof client_keys === 'object') {
        update.client_keys = {
          googleMaps: client_keys.googleMaps || '',
        };
      }
      const apiUser = await ApiUser.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true, runValidators: true },
      );
      if (!apiUser) return response.notFound(res, { message: 'API user not found' });
      return response.ok(res, { message: 'API user updated', data: apiUser });
    } catch (error) {
      return response.error(res, error);
    }
  },

  regenerateKey: async (req, res) => {
    try {
      const apiUser = await ApiUser.findById(req.params.id);
      if (!apiUser) return response.notFound(res, { message: 'API user not found' });

      apiUser.api_key = apiUser.generateApiKey();
      await apiUser.save();

      return response.ok(res, {
        message: 'API key regenerated successfully',
        data: apiUser,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  remove: async (req, res) => {
    try {
      const apiUser = await ApiUser.findByIdAndDelete(req.params.id);
      if (!apiUser) return response.notFound(res, { message: 'API user not found' });
      return response.ok(res, { message: 'API user deleted successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
