'use strict';
const BusRoute = require('@models/BusRoute');
const BusType = require('@models/BusType');
const HomeContent = require('@models/HomeContent');
const response = require('@responses');
const { fileUrl } = require('@services/fileUpload');

const tenantFilter = (req) => ({ api_user: req.apiUser._id });

const findRouteByParam = async (req, id) => {
  const byRouteId = await BusRoute.findOne({ routeId: id, ...tenantFilter(req) });
  if (byRouteId) return byRouteId;
  return BusRoute.findOne({ _id: id, ...tenantFilter(req) });
};

const calcSeatsAvailable = (seats, occupiedSeats = []) =>
  Math.max(0, seats - occupiedSeats.length);

const calcDuration = (departure, arrival) => {
  const d1 = new Date(departure);
  const d2 = new Date(arrival);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()) || d2 <= d1) return null;
  const mins = Math.round((d2 - d1) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const findBusTypeLayout = async (req, busTypeName) => {
  if (!busTypeName) return null;
  return BusType.findOne({
    name: new RegExp(`^${String(busTypeName).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    ...tenantFilter(req),
  });
};

const toAdminRoute = (route) => ({
  id: route.routeId,
  _id: route._id,
  routeId: route.routeId,
  operator: route.operator,
  from: route.from,
  to: route.to,
  departure: route.departure,
  arrival: route.arrival,
  duration: route.duration,
  price: route.price,
  currency: route.currency,
  seats: route.seats,
  seatsAvailable: route.seatsAvailable,
  busType: route.busType,
  status: route.status,
  isPopular: route.isPopular,
  occupiedSeats: route.occupiedSeats,
  isExpress: route.isExpress !== false,
  departureStation: route.departureStation || '',
  arrivalStation: route.arrivalStation || '',
  departureGate: route.departureGate || '',
  arrivalPlatform: route.arrivalPlatform || '',
  transferStation: route.transferStation || '',
  transferTime: route.transferTime || '',
  transferNote: route.transferNote || '',
  facilities: route.facilities || [],
  cancellationPolicy: route.cancellationPolicy || '',
  luggagePolicy: route.luggagePolicy || '',
  benefitNote: route.benefitNote || '',
  taxRate: route.taxRate,
  serviceFee: route.serviceFee,
  api_user: route.api_user,
  createdAt: route.createdAt,
  updatedAt: route.updatedAt,
});

module.exports = {
  listRoutes: async (req, res) => {
    try {
      const routes = await BusRoute.find(tenantFilter(req)).sort({ createdAt: -1 });
      return response.ok(res, { routes: routes.map(toAdminRoute) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  createRoute: async (req, res) => {
    try {
      const {
        routeId,
        operator,
        from,
        to,
        departure,
        arrival,
        duration,
        price,
        currency,
        seats,
        busType,
        status,
        isPopular,
        occupiedSeats,
        isExpress,
        departureStation,
        arrivalStation,
        departureGate,
        arrivalPlatform,
        transferStation,
        transferTime,
        transferNote,
        facilities,
        cancellationPolicy,
        luggagePolicy,
        benefitNote,
        taxRate,
        serviceFee,
      } = req.body;

      if (!operator || !from || !to || !departure || !arrival || price == null || !busType) {
        return response.badReq(res, {
          message: 'operator, from, to, departure, arrival, price and busType are required',
        });
      }

      const resolvedDuration = calcDuration(departure, arrival) || duration;
      if (!resolvedDuration) {
        return response.badReq(res, { message: 'Arrival must be after departure' });
      }

      const resolvedRouteId = routeId || `RT-${Date.now().toString().slice(-6)}`;
      const exists = await BusRoute.findOne({
        routeId: resolvedRouteId,
        ...tenantFilter(req),
      });
      if (exists) {
        return response.conflict(res, { message: 'Route ID already exists' });
      }

      const layout = await findBusTypeLayout(req, busType);
      const resolvedSeats =
        seats != null
          ? Number(seats)
          : layout
            ? layout.totalSeats
            : 40;
      const resolvedOccupied = Array.isArray(occupiedSeats) ? occupiedSeats : [];

      const route = await BusRoute.create({
        routeId: resolvedRouteId,
        operator,
        from,
        to,
        departure,
        arrival,
        duration: resolvedDuration,
        price: Number(price),
        currency: currency || 'EUR',
        seats: resolvedSeats,
        busType,
        status: status || 'active',
        isPopular: Boolean(isPopular),
        isExpress: isExpress !== false,
        departureStation: departureStation || '',
        arrivalStation: arrivalStation || '',
        departureGate: departureGate || '',
        arrivalPlatform: arrivalPlatform || '',
        transferStation: transferStation || '',
        transferTime: transferTime || '',
        transferNote: transferNote || '',
        facilities: Array.isArray(facilities) ? facilities : undefined,
        cancellationPolicy: cancellationPolicy || undefined,
        luggagePolicy: luggagePolicy || undefined,
        benefitNote: benefitNote || undefined,
        taxRate: taxRate != null ? Number(taxRate) : undefined,
        serviceFee: serviceFee != null ? Number(serviceFee) : undefined,
        api_user: req.apiUser._id,
      });

      return response.created(res, { message: 'Route created', route: toAdminRoute(route) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateRoute: async (req, res) => {
    try {
      const route = await findRouteByParam(req, req.params.id);
      if (!route) {
        return response.notFound(res, { message: 'Route not found' });
      }

      const fields = [
        'operator', 'from', 'to', 'departure', 'arrival', 'duration',
        'price', 'currency', 'seats', 'busType', 'status', 'isPopular',
        'isExpress', 'departureStation', 'arrivalStation',
        'departureGate', 'arrivalPlatform', 'transferStation', 'transferTime',
        'transferNote', 'facilities', 'cancellationPolicy', 'luggagePolicy',
        'benefitNote', 'taxRate', 'serviceFee',
      ];

      const update = {};
      for (const key of fields) {
        if (req.body[key] !== undefined) update[key] = req.body[key];
      }

      if (update.price != null) update.price = Number(update.price);
      if (update.seats != null) update.seats = Number(update.seats);
      if (update.isPopular != null) update.isPopular = Boolean(update.isPopular);
      if (update.isExpress != null) update.isExpress = Boolean(update.isExpress);
      if (update.taxRate != null) update.taxRate = Number(update.taxRate);
      if (update.serviceFee != null) update.serviceFee = Number(update.serviceFee);

      // When bus type changes and seats not explicitly sent, inherit capacity from type
      if (update.busType && req.body.seats === undefined) {
        const layout = await findBusTypeLayout(req, update.busType);
        if (layout) update.seats = layout.totalSeats;
      }

      const dep = update.departure ?? route.departure;
      const arr = update.arrival ?? route.arrival;
      const autoDuration = calcDuration(dep, arr);
      if (autoDuration) update.duration = autoDuration;

      const updated = await BusRoute.findByIdAndUpdate(route._id, update, { new: true });
      return response.ok(res, { message: 'Route updated', route: toAdminRoute(updated) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteRoute: async (req, res) => {
    try {
      const route = await findRouteByParam(req, req.params.id);
      if (!route) {
        return response.notFound(res, { message: 'Route not found' });
      }
      await BusRoute.findByIdAndDelete(route._id);
      return response.ok(res, { message: 'Route deleted' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getHomeContent: async (req, res) => {
    try {
      let home = await HomeContent.findOne(tenantFilter(req));
      if (!home) {
        home = await HomeContent.create({ api_user: req.apiUser._id });
      }
      return response.ok(res, { home });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateHomeContent: async (req, res) => {
    try {
      const { promoBadge, promoTitle, promoDesc, promoCode } = req.body;
      const update = {};

      if (promoBadge !== undefined) update.promoBadge = promoBadge;
      if (promoTitle !== undefined) update.promoTitle = promoTitle;
      if (promoDesc !== undefined) update.promoDesc = promoDesc;
      if (promoCode !== undefined) update.promoCode = promoCode;

      if (req.files?.headerImage?.[0]) {
        update.headerImage = fileUrl(req.files.headerImage[0]);
      }
      if (req.files?.promoImage?.[0]) {
        update.promoImage = fileUrl(req.files.promoImage[0]);
      }

      let home = await HomeContent.findOne(tenantFilter(req));
      if (!home) {
        home = await HomeContent.create({ ...update, api_user: req.apiUser._id });
      } else {
        home = await HomeContent.findByIdAndUpdate(home._id, update, { new: true });
      }

      return response.ok(res, { message: 'Home content updated', home });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateRouteSeats: async (req, res) => {
    try {
      const route = await findRouteByParam(req, req.params.id);
      if (!route) {
        return response.notFound(res, { message: 'Route not found' });
      }

      return response.ok(res, {
        message: 'Route seats update ignored (now dynamic)',
        route: toAdminRoute(route),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
