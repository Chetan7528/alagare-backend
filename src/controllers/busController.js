'use strict';
const BusRoute = require('@models/BusRoute');
const BusType = require('@models/BusType');
const HomeContent = require('@models/HomeContent');
const Booking = require('@models/Booking');
const City = require('@models/City');
const Operator = require('@models/Operator');
const response = require('@responses');
const { notifyUser } = require('@services/notification');

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

const toPublicRoute = (route, logo = '') => ({
  routeId: route.routeId,
  operator: route.operator,
  logo: logo || route.logo || route.operatorLogo || '',
  operatorLogo: logo || route.logo || route.operatorLogo || '',
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
  ...toPublicRoute(route, operatorDoc?.logo || ''),
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
  cancellationPolicyDetail:
    route.cancellationPolicyDetail ||
    'Full refund if cancelled 24 hours prior to departure. 50% refund between 12-24h. Non-refundable within 12 hours.',
  luggagePolicy: route.luggagePolicy || '1 Carry-on + 1 Checked bag Included',
  luggagePolicyDetail:
    route.luggagePolicyDetail ||
    'Includes 1 hand luggage (max 7kg) and 1 check-in bag (max 20kg). Excess baggage fee applies at gate.',
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
          name: c.name,
          country: c.country,
          parentCity: c.parentCity,
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
      const operators = await Operator.find(tenantFilter(req));
      const logoMap = new Map();
      operators.forEach((o) => {
        if (o.name && o.logo) {
          logoMap.set(o.name.trim().toLowerCase(), o.logo);
        }
      });

      const searchDateObj = new Date(date);
      searchDateObj.setHours(0, 0, 0, 0);
      const todayObj = new Date();
      todayObj.setHours(0, 0, 0, 0);

      let validRoutes = allRoutes
        .filter((r) => r.from.toLowerCase().includes(fromNorm) || fromNorm.includes(r.from.toLowerCase()))
        .filter((r) => r.to.toLowerCase().includes(toNorm) || toNorm.includes(r.to.toLowerCase()));

      if (searchDateObj < todayObj) {
        validRoutes = []; // Past dates are invalid
      } else if (searchDateObj.getTime() === todayObj.getTime()) {
        const now = new Date();
        validRoutes = validRoutes.filter(r => {
          let departureTimeStr = r.departure;
          if (r.stops && r.stops.length > 0) {
            const matchedStop = r.stops.find(s => s.stopName && (s.stopName.toLowerCase().includes(fromNorm) || fromNorm.includes(s.stopName.toLowerCase())));
            if (matchedStop && matchedStop.eta) departureTimeStr = matchedStop.eta;
          }
          
          if (!departureTimeStr) return true;
          
          const match = departureTimeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
          if (match) {
            let hours = parseInt(match[1], 10);
            const mins = parseInt(match[2], 10);
            const modifier = match[3] ? match[3].toUpperCase() : null;
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            
            const depTime = new Date();
            depTime.setHours(hours, mins, 0, 0);
            return depTime > now;
          }
          return true;
        });
      }

      const activeBookings = await Booking.find({
        ...tenantFilter(req),
        date: date,
        status: { $ne: 'cancelled' },
      });
      
      const routeOccupiedMap = {};
      activeBookings.forEach((b) => {
        if (!routeOccupiedMap[b.routeId]) {
          routeOccupiedMap[b.routeId] = 0;
        }
        routeOccupiedMap[b.routeId] += (b.seatKeys && b.seatKeys.length > 0) ? b.seatKeys.length : (Number(b.seats) || 1);
      });

      const results = validRoutes.map((r) => {
        const matchedLogo = logoMap.get((r.operator || '').trim().toLowerCase()) || '';
        const occupiedCount = routeOccupiedMap[r.routeId] || 0;
        const dynamicSeatsAvailable = Math.max(0, r.seats - occupiedCount);
        const routeData = toPublicRoute(r, matchedLogo);
        routeData.seatsAvailable = dynamicSeatsAvailable;
        return routeData;
      });

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
      const { date } = req.query;
      const route = await BusRoute.findOne({
        ...tenantFilter(req),
        routeId: req.params.routeId,
        status: 'active',
      });

      if (!route) {
        return response.notFound(res, { message: 'Route not found' });
      }

      let occupiedSeats = [];
      if (date) {
        const bookings = await Booking.find({
          ...tenantFilter(req),
          routeId: route.routeId,
          date: date,
          status: { $ne: 'cancelled' },
        });
        occupiedSeats = bookings.reduce((acc, b) => {
          if (b.seatKeys && Array.isArray(b.seatKeys)) {
            acc.push(...b.seatKeys);
          }
          return acc;
        }, []);
        occupiedSeats = [...new Set(occupiedSeats)];
      }

      const layout = await resolveSeatLayout(req, route);

      return response.ok(res, {
        routeId: route.routeId,
        busType: route.busType,
        rowCount: layout.rowCount,
        seatsPerSide: layout.seatsPerSide,
        occupiedSeats: occupiedSeats,
        occupied: occupiedSeats,
        ladiesSeats: route.ladiesSeats || ['0-1', '2-0', '5-2', '5-3', '7-1'],
        ladies: route.ladiesSeats || ['0-1', '2-0', '5-2', '5-3', '7-1'],
        seatsAvailable: Math.max(0, route.seats - occupiedSeats.length),
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
        discountAmount = 0,
        amount,
        departure,
        arrival,
        departureStation,
        arrivalStation,
        busType,
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
      const seatsRequested = seatList.length || Number(passengers) || 1;
      
      const existingBookings = await Booking.find({
        ...tenantFilter(req),
        routeId: route.routeId,
        date: date || '',
        status: { $ne: 'cancelled' },
      });

      const currentOccupied = existingBookings.reduce((acc, b) => {
        if (b.seatKeys && Array.isArray(b.seatKeys)) acc.push(...b.seatKeys);
        return acc;
      }, []);

      const currentOccupiedCountTotal = existingBookings.reduce((acc, b) => {
        return acc + ((b.seatKeys && b.seatKeys.length > 0) ? b.seatKeys.length : (Number(b.seats) || 1));
      }, 0);

      const dynamicSeatsAvailable = Math.max(0, route.seats - currentOccupiedCountTotal);

      if (seatList.length > 0) {
        const alreadyTaken = seatList.filter((s) => currentOccupied.includes(s));
        if (alreadyTaken.length > 0) {
          return response.conflict(res, {
            message: 'Some seats are no longer available',
            seats: alreadyTaken,
          });
        }
      }

      if (seatsRequested > dynamicSeatsAvailable) {
        return response.badReq(res, { message: 'Not enough seats available' });
      }

      const bookingRef = `ALG-${Date.now().toString(36).toUpperCase()}`;
      const seatCount = seatList.length || Number(passengers) || 1;
      const pricing = priceBreakdown(route, seatCount);
      let finalAmount = Number(amount) || pricing.total;
      if (discountAmount > 0 && !amount) {
        finalAmount = Math.max(0, Math.round((pricing.total - Number(discountAmount)) * 100) / 100);
      }
      pricing.discount = Number(discountAmount) || 0;
      pricing.total = finalAmount;

      const booking = await Booking.create({
        ref: bookingRef,
        passenger: passengerName || contactEmail.split('@')[0],
        email: contactEmail,
        route: `${route.from} → ${route.to}`,
        routeId: route.routeId,
        operator: route.operator,
        date: date || '',
        departure: departure || '',
        arrival: arrival || '',
        departureStation: departureStation || '',
        arrivalStation: arrivalStation || '',
        busType: busType || route.busType || '',
        seats: seatCount,
        seatKeys: seatList,
        amount: finalAmount,
        status: 'confirmed',
        api_user: req.apiUser._id,
      });

      await notifyUser(
        req.user,
        'bookingConfirmed',
        'Booking Confirmed',
        `Your booking ${bookingRef} for ${route.from} → ${route.to} is confirmed.`,
      );

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

  myBookings: async (req, res) => {
    try {
      const bookings = await Booking.find({
        email: req.user.email,
        api_user: req.apiUser._id,
      }).sort({ createdAt: -1 });

      const parseRoute = (route) => {
        if (!route) return { from: '', to: '' };
        const parts = route.split(/→|->|—>/).map(s => s.trim());
        return { from: parts[0] || '', to: parts[1] || '' };
      };

      return response.ok(res, {
        bookings: bookings.map((b) => {
          const { from, to } = parseRoute(b.route);
          return {
            bookingRef: b.ref,
            route: b.route,
            from,
            to,
            passenger: b.passenger,
            date: b.date,
            departure: b.departure || '',
            arrival: b.arrival || '',
            departureStation: b.departureStation || '',
            arrivalStation: b.arrivalStation || '',
            operator: b.operator,
            seats: b.seats,
            seatKeys: b.seatKeys,
            amount: b.amount,
            status: b.status,
            routeId: b.routeId,
            createdAt: b.createdAt,
          };
        }),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  bookingDetail: async (req, res) => {
    try {
      const booking = await Booking.findOne({
        ref: req.params.bookingRef,
        email: req.user.email,
        api_user: req.apiUser._id,
      });
      if (!booking) {
        return response.notFound(res, { message: 'Booking not found' });
      }
      return response.ok(res, { booking });
    } catch (error) {
      return response.error(res, error);
    }
  },

  applyCoupon: async (req, res) => {
    try {
      const { code, routeId, totalAmount } = req.body;
      if (!code) {
        return response.badReq(res, { message: 'Promo code is required' });
      }
      const Campaign = require('@models/Campaign');
      const promoCode = String(code).trim().toUpperCase();
      const campaign = await Campaign.findOne({
        code: promoCode,
        status: 'active',
        ...tenantFilter(req),
      });

      if (!campaign) {
        return response.badReq(res, { message: 'Invalid or expired promo code' });
      }

      if (campaign.routeId && campaign.routeId !== 'all' && campaign.routeId !== routeId) {
        return response.badReq(res, { message: 'Promo code is not applicable for this route' });
      }

      const amount = Number(totalAmount) || 0;
      let discount = Math.round(((amount * campaign.discountPercent) / 100) * 100) / 100;
      if (campaign.maxDiscount > 0 && discount > campaign.maxDiscount) {
        discount = campaign.maxDiscount;
      }

      const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100);

      return response.ok(res, {
        message: 'Coupon applied successfully!',
        code: campaign.code,
        title: campaign.title,
        discountPercent: campaign.discountPercent,
        discount,
        finalAmount,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  cancelBooking: async (req, res) => {
    try {
      const { bookingRef } = req.params;
      const booking = await Booking.findOne({
        ref: bookingRef,
        email: req.user.email,
        api_user: req.apiUser._id,
      });

      if (!booking) {
        return response.notFound(res, { message: 'Booking not found' });
      }

      if (booking.status === 'cancelled') {
        return response.badReq(res, { message: 'Booking is already cancelled' });
      }

      if (booking.date) {
        const dateParts = String(booking.date).split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          let hours = 23;
          let minutes = 59;

          if (booking.departure) {
            const match = String(booking.departure).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (match) {
              hours = parseInt(match[1], 10);
              minutes = parseInt(match[2], 10);
              const ampm = match[3] ? match[3].toUpperCase() : null;
              if (ampm === 'PM' && hours < 12) hours += 12;
              if (ampm === 'AM' && hours === 12) hours = 0;
            }
          }

          const tripDate = new Date(year, month, day, hours, minutes);
          if (Date.now() > tripDate.getTime()) {
            return response.badReq(res, {
              message: 'Cancellation window closed. Past or ongoing journeys cannot be cancelled.',
            });
          }
        }
      }

      booking.status = 'cancelled';
      await booking.save();

      await notifyUser(
        req.user,
        'tripUpdates',
        'Booking Cancelled',
        `Your booking ${booking.ref} for ${booking.route} has been cancelled.`,
      );

      return response.ok(res, {
        message: 'Ticket cancelled successfully',
        booking,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
