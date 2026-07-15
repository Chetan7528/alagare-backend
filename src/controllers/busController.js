'use strict';
const BusRoute = require('@models/BusRoute');
const BusType = require('@models/BusType');
const HomeContent = require('@models/HomeContent');
const Booking = require('@models/Booking');
const City = require('@models/City');
const Operator = require('@models/Operator');
const response = require('@responses');

const tenantFilter = (req) => ({ api_user: req.apiUser._id });

const resolveSeatLayout = async (req, route) => {
  const type = await BusType.findOne({
    name: new RegExp(
      `^${String(route.busType || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    ),
    ...tenantFilter(req),
  });
  if (type) {
    return {
      rowCount: type.rowCount || 10,
      seatsPerSide: type.seatsPerSide || 2,
    };
  }
  return { rowCount: 10, seatsPerSide: 2 };
};

/** App UI expects HH:mm — support both time-only and datetime values */
const toDisplayTime = (val) => {
  if (!val) return '';
  if (/^\d{2}:\d{2}$/.test(String(val))) return String(val);
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toDisplayTimeAmPm = (val) => {
  const hhmm = toDisplayTime(val);
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

const toPublicRoute = (route) => ({
  routeId: route.routeId,
  operator: route.operator,
  from: route.from,
  to: route.to,
  departure: toDisplayTime(route.departure),
  arrival: toDisplayTime(route.arrival),
  departureAt: route.departure,
  arrivalAt: route.arrival,
  duration: route.duration,
  price: route.price,
  currency: route.currency,
  seatsAvailable: route.seatsAvailable,
  busType: route.busType,
  isExpress: route.isExpress !== false,
});

const toPopularRoute = (route) => ({
  routeId: route.routeId,
  from: route.from,
  to: route.to,
  operator: route.operator,
  fromPrice: route.price,
  currency: route.currency,
});

const priceBreakdown = (route, seatCount = 1) => {
  const baseFare = Number(route.price) * seatCount;
  const taxRate = route.taxRate != null ? Number(route.taxRate) : 0.086;
  const serviceFee = route.serviceFee != null ? Number(route.serviceFee) : 4.5;
  const taxes = Math.round(baseFare * taxRate * 100) / 100;
  const total = Math.round((baseFare + taxes + serviceFee) * 100) / 100;
  return {
    baseFare,
    taxes,
    serviceFee,
    taxRate,
    seatCount,
    total,
    currency: route.currency || 'EUR',
  };
};

const toTripDetails = (route, operatorDoc) => ({
  ...toPublicRoute(route),
  departureDisplay: toDisplayTimeAmPm(route.departure),
  arrivalDisplay: toDisplayTimeAmPm(route.arrival),
  departureStation: route.departureStation || `${route.from} Coach Station`,
  arrivalStation: route.arrivalStation || `${route.to} Terminal`,
  departureGate: route.departureGate || 'Gate 14 • Platform A',
  arrivalPlatform: route.arrivalPlatform || 'International Arrivals • Platform 8',
  transferStation: route.transferStation || '',
  transferTime: route.transferTime || '',
  transferNote: route.transferNote || '',
  facilities:
    Array.isArray(route.facilities) && route.facilities.length
      ? route.facilities
      : ['wifi', 'power', 'ac', 'reclining'],
  cancellationPolicy:
    route.cancellationPolicy || 'Full refund up to 24h before departure',
  luggagePolicy: route.luggagePolicy || '1 Carry-on + 1 Checked bag Included',
  benefitNote:
    route.benefitNote || 'Standard Premier includes meal and lounge access.',
  pricing: priceBreakdown(route, 1),
  operatorInfo: operatorDoc
    ? {
        name: operatorDoc.name,
        rating: operatorDoc.rating || 0,
        reviewCount: operatorDoc.reviewCount || 0,
        description:
          operatorDoc.description ||
          `${operatorDoc.name} provides safe, comfortable intercity travel with modern coaches and reliable schedules.`,
        logo: operatorDoc.logo || '',
        phone: operatorDoc.phone || '',
        contact: operatorDoc.contact || '',
      }
    : {
        name: route.operator,
        rating: 4.8,
        reviewCount: 1200,
        description: `${route.operator} provides safe, comfortable intercity travel with modern coaches and reliable schedules.`,
        logo: '',
        phone: '',
        contact: '',
      },
});

module.exports = {
  searchCities: async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const filter = { ...tenantFilter(req), status: 'active' };
      if (q.length >= 1) {
        filter.name = { $regex: q, $options: 'i' };
      }
      const cities = await City.find(filter).sort({ name: 1 }).limit(12);
      return response.ok(res, {
        cities: cities.map((c) => ({
          id: String(c._id),
          label: c.country ? `${c.name}, ${c.country}` : c.name,
          city: c.name,
          country: c.country || '',
        })),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  listRoutes: async (req, res) => {
    try {
      const routes = await BusRoute.find({
        ...tenantFilter(req),
        status: 'active',
        isPopular: true,
      }).sort({ createdAt: 1 });

      return response.ok(res, {
        api_user: req.apiUser.email,
        routes: routes.map(toPopularRoute),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  searchBuses: async (req, res) => {
    try {
      const { from, to, date, travelers = 1 } = req.body;

      if (!from || !to || !date) {
        return response.badReq(res, { message: 'from, to and date are required' });
      }

      const fromNorm = String(from).trim().toLowerCase();
      const toNorm = String(to).trim().toLowerCase();

      const allRoutes = await BusRoute.find({ ...tenantFilter(req), status: 'active' });
      const results = allRoutes
        .filter(
          (r) =>
            r.from.toLowerCase().includes(fromNorm) || fromNorm.includes(r.from.toLowerCase()),
        )
        .filter(
          (r) => r.to.toLowerCase().includes(toNorm) || toNorm.includes(r.to.toLowerCase()),
        )
        .map(toPublicRoute);

      return response.ok(res, {
        api_user: req.apiUser.email,
        query: { from, to, date, travelers },
        count: results.length,
        buses: results,
      });
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

  getRouteSeats: async (req, res) => {
    try {
      const route = await BusRoute.findOne({
        ...tenantFilter(req),
        routeId: req.params.routeId,
        status: 'active',
      });

      if (!route) {
        return response.notFound(res, { message: 'Route not found' });
      }

      const layout = await resolveSeatLayout(req, route);

      return response.ok(res, {
        routeId: route.routeId,
        busType: route.busType,
        rowCount: layout.rowCount,
        seatsPerSide: layout.seatsPerSide,
        occupiedSeats: route.occupiedSeats,
        seatsAvailable: route.seatsAvailable,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getTripDetails: async (req, res) => {
    try {
      const route = await BusRoute.findOne({
        ...tenantFilter(req),
        routeId: req.params.routeId,
        status: 'active',
      });
      if (!route) {
        return response.notFound(res, { message: 'Route not found' });
      }

      const operatorDoc = await Operator.findOne({
        name: new RegExp(
          `^${String(route.operator || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i',
        ),
        ...tenantFilter(req),
      });

      const seatCount = Math.max(1, Number(req.query.seats) || 1);
      const details = toTripDetails(route, operatorDoc);
      details.pricing = priceBreakdown(route, seatCount);

      return response.ok(res, { trip: details });
    } catch (error) {
      return response.error(res, error);
    }
  },

  bookBus: async (req, res) => {
    try {
      const {
        routeId,
        passengers,
        contactEmail,
        seats,
        passengerName,
        phone,
        paymentMethod,
        date,
      } = req.body;

      if (!routeId || !passengers || !contactEmail) {
        return response.badReq(res, {
          message: 'routeId, passengers and contactEmail are required',
        });
      }

      const route = await BusRoute.findOne({
        ...tenantFilter(req),
        routeId,
        status: 'active',
      });
      if (!route) {
        return response.notFound(res, { message: 'Route not found' });
      }

      const seatList = Array.isArray(seats) ? seats.map(String) : [];
      if (seatList.length > 0) {
        const alreadyTaken = seatList.filter((s) => route.occupiedSeats.includes(s));
        if (alreadyTaken.length > 0) {
          return response.conflict(res, {
            message: 'Some seats are no longer available',
            seats: alreadyTaken,
          });
        }

        if (seatList.length > route.seatsAvailable) {
          return response.badReq(res, { message: 'Not enough seats available' });
        }

        route.occupiedSeats = [...new Set([...route.occupiedSeats, ...seatList])];
        route.seatsAvailable = Math.max(0, route.seats - route.occupiedSeats.length);
        await route.save();
      }

      const bookingRef = `ALG-${Date.now().toString(36).toUpperCase()}`;
      const seatCount = seatList.length || Number(passengers) || 1;
      const pricing = priceBreakdown(route, seatCount);

      const booking = await Booking.create({
        ref: bookingRef,
        passenger: passengerName || contactEmail.split('@')[0],
        email: contactEmail,
        route: `${route.from} → ${route.to}`,
        routeId: route.routeId,
        operator: route.operator,
        date: date || '',
        seats: seatCount,
        seatKeys: seatList,
        amount: pricing.total,
        status: 'confirmed',
        api_user: req.apiUser._id,
      });

      return response.created(res, {
        message: 'Booking confirmed successfully',
        booking: {
          bookingRef: booking.ref,
          status: booking.status,
          route: toPublicRoute(route),
          passengers,
          contactEmail,
          passengerName: booking.passenger,
          phone: phone || '',
          paymentMethod: paymentMethod || '',
          seats: seatList,
          amount: pricing.total,
          pricing,
          api_user: req.apiUser.email,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
