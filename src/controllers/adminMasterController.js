'use strict';
const City = require('@models/City');
const BusType = require('@models/BusType');
const PayoutSettlement = require('@models/PayoutSettlement');
const response = require('@responses');

const tenantFilter = (req) => ({ api_user: req.apiUser._id });

module.exports = {
  // ── Cities (admin) ──
  listCities: async (req, res) => {
    try {
      const cities = await City.find(tenantFilter(req)).sort({ name: 1 });
      return response.ok(res, {
        cities: cities.map((c) => ({
          id: c._id,
          name: c.name,
          country: c.country,
          status: c.status,
        })),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  createCity: async (req, res) => {
    try {
      const { name, country, status } = req.body;
      if (!name) return response.badReq(res, { message: 'name is required' });

      const exists = await City.findOne({
        name: new RegExp(`^${String(name).trim()}$`, 'i'),
        ...tenantFilter(req),
      });
      if (exists) return response.conflict(res, { message: 'City already exists' });

      const city = await City.create({
        name: String(name).trim(),
        country: country || '',
        status: status || 'active',
        api_user: req.apiUser._id,
      });
      return response.created(res, {
        message: 'City created',
        city: { id: city._id, name: city.name, country: city.country, status: city.status },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateCity: async (req, res) => {
    try {
      const { name, country, status } = req.body;
      const update = {};
      if (name !== undefined) update.name = String(name).trim();
      if (country !== undefined) update.country = country;
      if (status !== undefined) update.status = status;

      const city = await City.findOneAndUpdate(
        { _id: req.params.id, ...tenantFilter(req) },
        update,
        { new: true },
      );
      if (!city) return response.notFound(res, { message: 'City not found' });
      return response.ok(res, {
        message: 'City updated',
        city: { id: city._id, name: city.name, country: city.country, status: city.status },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteCity: async (req, res) => {
    try {
      const city = await City.findOneAndDelete({ _id: req.params.id, ...tenantFilter(req) });
      if (!city) return response.notFound(res, { message: 'City not found' });
      return response.ok(res, { message: 'City deleted' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // ── Bus types (admin) — layout template like RedBus bus inventory ──
  listBusTypes: async (req, res) => {
    try {
      const busTypes = await BusType.find(tenantFilter(req)).sort({ name: 1 });
      return response.ok(res, {
        busTypes: busTypes.map((t) => ({
          id: t._id,
          name: t.name,
          rowCount: t.rowCount,
          seatsPerSide: t.seatsPerSide,
          totalSeats: t.totalSeats,
          status: t.status,
        })),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  createBusType: async (req, res) => {
    try {
      const { name, status, rowCount, seatsPerSide, totalSeats } = req.body;
      if (!name) return response.badReq(res, { message: 'name is required' });

      const exists = await BusType.findOne({
        name: new RegExp(`^${String(name).trim()}$`, 'i'),
        ...tenantFilter(req),
      });
      if (exists) return response.conflict(res, { message: 'Bus type already exists' });

      const rows = rowCount != null ? Number(rowCount) : 10;
      const perSide = seatsPerSide != null ? Number(seatsPerSide) : 2;
      const seats =
        totalSeats != null ? Number(totalSeats) : rows * perSide * 2;

      const busType = await BusType.create({
        name: String(name).trim(),
        rowCount: rows,
        seatsPerSide: perSide,
        totalSeats: seats,
        status: status || 'active',
        api_user: req.apiUser._id,
      });
      return response.created(res, {
        message: 'Bus type created',
        busType: {
          id: busType._id,
          name: busType.name,
          rowCount: busType.rowCount,
          seatsPerSide: busType.seatsPerSide,
          totalSeats: busType.totalSeats,
          status: busType.status,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateBusType: async (req, res) => {
    try {
      const { name, status, rowCount, seatsPerSide, totalSeats } = req.body;
      const update = {};
      if (name !== undefined) update.name = String(name).trim();
      if (status !== undefined) update.status = status;
      if (rowCount != null) update.rowCount = Number(rowCount);
      if (seatsPerSide != null) update.seatsPerSide = Number(seatsPerSide);
      if (totalSeats != null) {
        update.totalSeats = Number(totalSeats);
      } else if (rowCount != null || seatsPerSide != null) {
        const existing = await BusType.findOne({
          _id: req.params.id,
          ...tenantFilter(req),
        });
        if (existing) {
          const rows = update.rowCount ?? existing.rowCount;
          const perSide = update.seatsPerSide ?? existing.seatsPerSide;
          update.totalSeats = rows * perSide * 2;
        }
      }

      const busType = await BusType.findOneAndUpdate(
        { _id: req.params.id, ...tenantFilter(req) },
        update,
        { new: true },
      );
      if (!busType) return response.notFound(res, { message: 'Bus type not found' });
      return response.ok(res, {
        message: 'Bus type updated',
        busType: {
          id: busType._id,
          name: busType.name,
          rowCount: busType.rowCount,
          seatsPerSide: busType.seatsPerSide,
          totalSeats: busType.totalSeats,
          status: busType.status,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteBusType: async (req, res) => {
    try {
      const busType = await BusType.findOneAndDelete({
        _id: req.params.id,
        ...tenantFilter(req),
      });
      if (!busType) return response.notFound(res, { message: 'Bus type not found' });
      return response.ok(res, { message: 'Bus type deleted' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  listSettlements: async (req, res) => {
    try {
      const settlements = await PayoutSettlement.find(tenantFilter(req)).sort({ createdAt: -1 });
      return response.ok(res, { settlements });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateSettlementStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['pending', 'verified', 'settled', 'suspended', 'rejected'].includes(status)) {
        return response.badReq(res, { message: 'Invalid status' });
      }

      const settlement = await PayoutSettlement.findOneAndUpdate(
        { _id: id, ...tenantFilter(req) },
        { status },
        { new: true }
      );

      if (!settlement) return response.notFound(res, { message: 'Settlement request not found' });
      return response.ok(res, { message: 'Settlement status updated', settlement });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
