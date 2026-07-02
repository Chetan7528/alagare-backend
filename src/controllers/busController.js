'use strict';
const response = require('@responses');

/** Mock bus inventory — replace with real operator integrations later */
const MOCK_ROUTES = [
  {
    routeId: 'RT-101',
    operator: 'Alagare Express',
    from: 'Berlin',
    to: 'Munich',
    departure: '08:30',
    arrival: '14:15',
    duration: '5h 45m',
    price: 42.5,
    currency: 'EUR',
    seatsAvailable: 18,
    busType: 'AC Sleeper',
  },
  {
    routeId: 'RT-102',
    operator: 'Alagare Express',
    from: 'Berlin',
    to: 'Munich',
    departure: '14:00',
    arrival: '19:40',
    duration: '5h 40m',
    price: 38.0,
    currency: 'EUR',
    seatsAvailable: 24,
    busType: 'AC Seater',
  },
  {
    routeId: 'RT-103',
    operator: 'Berlin Express',
    from: 'Berlin',
    to: 'Munich',
    departure: '06:15',
    arrival: '12:00',
    duration: '5h 45m',
    price: 18.5,
    currency: 'EUR',
    seatsAvailable: 12,
    busType: 'Standard Class',
  },
  {
    routeId: 'RT-104',
    operator: 'FlixGo Premium',
    from: 'Berlin',
    to: 'Munich',
    departure: '09:00',
    arrival: '13:30',
    duration: '4h 30m',
    price: 42.0,
    currency: 'EUR',
    seatsAvailable: 4,
    busType: 'Premium Coach',
  },
  {
    routeId: 'RT-105',
    operator: 'Berlin Express',
    from: 'Berlin',
    to: 'Munich',
    departure: '08:30',
    arrival: '14:15',
    duration: '5h 45m',
    price: 24.99,
    currency: 'EUR',
    seatsAvailable: 12,
    busType: 'Standard Class',
  },
  {
    routeId: 'RT-201',
    operator: 'TransiHub Partner',
    from: 'London',
    to: 'Paris',
    departure: '07:15',
    arrival: '13:00',
    duration: '5h 45m',
    price: 55.0,
    currency: 'EUR',
    seatsAvailable: 12,
    busType: 'Luxury Coach',
  },
];

module.exports = {
  /** GET /api/v1/buses/routes — list popular routes (third-party) */
  listRoutes: async (req, res) => {
    try {
      return response.ok(res, {
        partner: req.partner.companyName,
        routes: MOCK_ROUTES.map(({ routeId, from, to, operator, price, currency }) => ({
          routeId,
          from,
          to,
          operator,
          fromPrice: price,
          currency,
        })),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  /** POST /api/v1/buses/search — search buses (third-party) */
  searchBuses: async (req, res) => {
    try {
      const { from, to, date, travelers = 1 } = req.body;

      if (!from || !to || !date) {
        return response.badReq(res, { message: 'from, to and date are required' });
      }

      const fromNorm = String(from).trim().toLowerCase();
      const toNorm = String(to).trim().toLowerCase();

      const results = MOCK_ROUTES.filter(
        (r) =>
          r.from.toLowerCase().includes(fromNorm) || fromNorm.includes(r.from.toLowerCase()),
      ).filter(
        (r) => r.to.toLowerCase().includes(toNorm) || toNorm.includes(r.to.toLowerCase()),
      );

      return response.ok(res, {
        partner: req.partner.companyName,
        query: { from, to, date, travelers },
        count: results.length,
        buses: results,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  /** POST /api/v1/buses/book — placeholder booking (third-party) */
  bookBus: async (req, res) => {
    try {
      const { routeId, passengers, contactEmail } = req.body;

      if (!routeId || !passengers || !contactEmail) {
        return response.badReq(res, {
          message: 'routeId, passengers and contactEmail are required',
        });
      }

      const route = MOCK_ROUTES.find((r) => r.routeId === routeId);
      if (!route) {
        return response.notFound(res, { message: 'Route not found' });
      }

      const bookingRef = `ALG-${Date.now().toString(36).toUpperCase()}`;

      return response.created(res, {
        message: 'Booking initiated successfully',
        booking: {
          bookingRef,
          status: 'pending_confirmation',
          route,
          passengers,
          contactEmail,
          partner: req.partner.companyName,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
