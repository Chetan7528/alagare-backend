'use strict';
const BusRoute = require('@models/BusRoute');
const BusType = require('@models/BusType');
const HomeContent = require('@models/HomeContent');
const Booking = require('@models/Booking');
const City = require('@models/City');
const Operator = require('@models/Operator');
const PlatformSettings = require('@models/PlatformSettings');
const response = require('@responses');
const { notifyUser } = require('@services/notification');

const tenantFilter = (req) => ({ api_user: req.apiUser._id });

const getEffectivePlatformPricing = async (req, operatorName) => {
  let commissionRate = 5;
  let taxRate = 0;
  let serviceFee = 0;
  try {
    const settings = await PlatformSettings.findOne(tenantFilter(req));
    if (settings) {
      if (settings.commissionRate != null) commissionRate = Number(settings.commissionRate);
      if (settings.taxRate != null) taxRate = Number(settings.taxRate);
      if (settings.serviceFee != null) serviceFee = Number(settings.serviceFee);
    }
    if (operatorName) {
      const op = await Operator.findOne({
        name: new RegExp(`^${String(operatorName).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        ...tenantFilter(req),
      });
      if (op && op.commissionRate != null) {
        commissionRate = Number(op.commissionRate);
      }
    }
  } catch (err) {}
  return {
    commissionRate: Math.max(0, commissionRate),
    taxRate: Math.max(0, taxRate),
    serviceFee: Math.max(0, serviceFee),
  };
};

const getEffectiveCommissionRate = async (req, operatorName) => {
  const p = await getEffectivePlatformPricing(req, operatorName);
  return p.commissionRate;
};

const userBookingFilter = (req) => {
  const userConditions = [];
  if (req.user?._id) {
    userConditions.push({ user: req.user._id });
  }
  if (req.user?.email) {
    userConditions.push({ email: req.user.email.toLowerCase().trim() });
  }
  if (req.user?.phone) {
    userConditions.push({ phone: req.user.phone.trim() });
    userConditions.push({ email: `${req.user.phone.trim()}@alagare.com` });
  }
  if (req.user?.fullname) {
    userConditions.push({ passenger: req.user.fullname.trim() });
  }
  return {
    api_user: req.apiUser._id,
    ...(userConditions.length > 0 ? { $or: userConditions } : { email: req.user?.email || '__no_user__' }),
  };
};

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

const extractTimeComponents = (timeVal) => {
  if (!timeVal) return { hours: 0, mins: 0 };
  const str = String(timeVal).trim();
  
  if (str.includes('T')) {
    const timePart = str.split('T')[1];
    const match = timePart.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return { hours: parseInt(match[1], 10), mins: parseInt(match[2], 10) };
    }
  }

  const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const modifier = match[3] ? match[3].toUpperCase() : null;
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return { hours, mins };
  }

  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return { hours: d.getHours(), mins: d.getMinutes() };
  }

  return { hours: 0, mins: 0 };
};

const parseDepartureDateTime = (dateStr, timeVal) => {
  if (!dateStr) return null;
  const strDate = String(dateStr).trim();
  let y, m, d;
  if (/^\d{4}-\d{2}-\d{2}/.test(strDate)) {
    const parts = strDate.split('T')[0].split('-').map(Number);
    y = parts[0];
    m = parts[1] - 1;
    d = parts[2];
  } else if (/^\d{2}-\d{2}-\d{4}/.test(strDate)) {
    const parts = strDate.split('-').map(Number);
    y = parts[2];
    m = parts[1] - 1;
    d = parts[0];
  } else {
    const parsed = new Date(strDate);
    if (Number.isNaN(parsed.getTime())) return null;
    y = parsed.getFullYear();
    m = parsed.getMonth();
    d = parsed.getDate();
  }

  const { hours, mins } = extractTimeComponents(timeVal);
  return new Date(y, m, d, hours, mins, 0, 0);
};

const isTripDeparted = (dateStr, timeVal, bufferMinutes = 0) => {
  const departureDate = parseDepartureDateTime(dateStr, timeVal);
  if (!departureDate) return false;
  const now = new Date();
  const cutoffTime = new Date(departureDate.getTime() - bufferMinutes * 60 * 1000);
  return now >= cutoffTime;
};

const toPublicRoute = (route, logo = '', commissionRate = 5) => {
  const operatorPrice = Number(route.price) || 0;
  const commissionPerSeat = Math.round((operatorPrice * (commissionRate / 100)) * 100) / 100;
  const customerPrice = operatorPrice + commissionPerSeat;

  return {
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
    price: customerPrice,
    operatorBasePrice: operatorPrice,
    commissionRate,
    commissionAmount: commissionPerSeat,
    currency: route.currency,
    seatsAvailable: route.seatsAvailable,
    busType: route.busType,
    isExpress: route.isExpress !== false,
  };
};

const toPopularRoute = (route, commissionRate = 5) => {
  const operatorPrice = Number(route.price) || 0;
  const commissionPerSeat = Math.round((operatorPrice * (commissionRate / 100)) * 100) / 100;
  return {
    routeId: route.routeId,
    from: route.from,
    to: route.to,
    operator: route.operator,
    fromPrice: operatorPrice + commissionPerSeat,
    operatorBasePrice: operatorPrice,
    commissionRate,
    currency: route.currency,
  };
};

const priceBreakdown = (route, seatCount = 1, commissionRate = 5, taxRate = 0, serviceFee = 0) => {
  const operatorPrice = Number(route.price) || 0;
  const commissionPerSeat = Math.round((operatorPrice * (commissionRate / 100)) * 100) / 100;
  const customerUnitPrice = operatorPrice + commissionPerSeat;

  const operatorBaseFare = Math.round(operatorPrice * seatCount * 100) / 100;
  const commissionAmount = Math.round(commissionPerSeat * seatCount * 100) / 100;
  const baseFare = Math.round(customerUnitPrice * seatCount * 100) / 100;

  const effectiveTaxRate = Number(taxRate != null ? taxRate : 0);
  const effectiveServiceFee = Number(serviceFee != null ? serviceFee : 0);
  const taxes = Math.round(baseFare * (effectiveTaxRate / 100) * 100) / 100;
  const total = Math.round((baseFare + taxes + effectiveServiceFee) * 100) / 100;

  return {
    operatorPrice,
    commissionRate,
    commissionPerSeat,
    customerUnitPrice,
    operatorBaseFare,
    commissionAmount,
    baseFare,
    taxes,
    serviceFee: effectiveServiceFee,
    taxRate: effectiveTaxRate,
    seatCount,
    total,
    currency: route.currency || 'EUR',
  };
};

const toTripDetails = (route, operatorDoc, commissionRate = 5, seatCount = 1, taxRate = 0, serviceFee = 0) => ({
  ...toPublicRoute(route, operatorDoc?.logo || '', commissionRate),
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
  pricing: priceBreakdown(route, seatCount, commissionRate, taxRate, serviceFee),
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

  searchPlaces: async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (!q || q.length < 2) {
        return response.ok(res, { places: [] });
      }

      const googleKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      let googlePlaces = [];

      if (googleKey) {
        try {
          const axios = require('axios');
          const gRes = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
            params: {
              input: q,
              key: googleKey,
            },
            timeout: 8000,
          });

          if (gRes.data?.predictions && Array.isArray(gRes.data.predictions)) {
            googlePlaces = gRes.data.predictions.map((p) => {
              const mainText = p.structured_formatting?.main_text || (p.description || '').split(',')[0]?.trim();
              const secondaryText = p.structured_formatting?.secondary_text || '';
              return {
                id: p.place_id,
                name: mainText,
                city: mainText,
                parentCity: secondaryText,
                label: p.description,
                type: 'google',
              };
            });
          }
        } catch (err) {
          console.error('Google Places Search API Error:', err?.message);
        }
      }

      // Also search database saved cities
      const dbCities = await City.find({
        ...tenantFilter(req),
        status: 'active',
        name: { $regex: q, $options: 'i' },
      }).limit(8);

      const dbPlaces = dbCities.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        city: c.name,
        parentCity: c.parentCity || '',
        label: c.name + (c.country ? `, ${c.country}` : ''),
        type: 'saved',
      }));

      // Merge and deduplicate
      const seen = new Set();
      const merged = [];
      for (const p of [...dbPlaces, ...googlePlaces]) {
        const key = (p.label || p.name || '').toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(p);
      }

      return response.ok(res, { places: merged });
    } catch (error) {
      return response.error(res, error);
    }
  },

  listRoutes: async (req, res) => {
    try {
      const defaultCommission = await getEffectiveCommissionRate(req);
      const routes = await BusRoute.find({
        ...tenantFilter(req),
        status: 'active',
        isPopular: true,
      }).sort({ createdAt: 1 });

      return response.ok(res, {
        api_user: req.apiUser.email,
        routes: routes.map((r) => toPopularRoute(r, defaultCommission)),
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
      const defaultCommission = await getEffectiveCommissionRate(req);

      const logoMap = new Map();
      const opCommissionMap = new Map();
      operators.forEach((o) => {
        if (o.name && o.logo) {
          logoMap.set(o.name.trim().toLowerCase(), o.logo);
        }
        if (o.name && o.commissionRate != null) {
          opCommissionMap.set(o.name.trim().toLowerCase(), Number(o.commissionRate));
        }
      });

      let validRoutes = allRoutes
        .filter((r) => r.from.toLowerCase().includes(fromNorm) || fromNorm.includes(r.from.toLowerCase()))
        .filter((r) => r.to.toLowerCase().includes(toNorm) || toNorm.includes(r.to.toLowerCase()));

      validRoutes = validRoutes.filter((r) => {
        let departureTimeStr = r.departure;
        if (r.stops && r.stops.length > 0) {
          const matchedStop = r.stops.find(
            (s) => s.stopName && (s.stopName.toLowerCase().includes(fromNorm) || fromNorm.includes(s.stopName.toLowerCase()))
          );
          if (matchedStop && matchedStop.eta) departureTimeStr = matchedStop.eta;
        }
        return !isTripDeparted(date, departureTimeStr, 0);
      });

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
        const commRate = opCommissionMap.get((r.operator || '').trim().toLowerCase()) ?? defaultCommission;
        const routeData = toPublicRoute(r, matchedLogo, commRate);
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
        ladiesSeats: route.ladiesSeats || [],
        ladies: route.ladiesSeats || [],
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

      const pricingSettings = await getEffectivePlatformPricing(req, route.operator);
      const seatCount = Math.max(1, Number(req.query.seats) || 1);
      const details = toTripDetails(
        route,
        operatorDoc,
        pricingSettings.commissionRate,
        seatCount,
        pricingSettings.taxRate,
        pricingSettings.serviceFee,
      );

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
        paymentIntentId,
        paymentStatus,
        date,
        promoCode,
        discountAmount = 0,
        amount,
        departure,
        arrival,
        departureStation,
        arrivalStation,
        busType,
      } = req.body;

      const finalContactEmail = contactEmail || req.user?.email || (phone || req.user?.phone ? `${phone || req.user?.phone}@alagare.com` : 'passenger@alagare.com');
      if (!routeId || !passengers || !finalContactEmail) {
        return response.badReq(res, {
          message: 'routeId, passengers and contact details are required',
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

      if (date && isTripDeparted(date, departure || route.departure, 0)) {
        return response.badReq(res, {
          message: 'This bus has already departed for the selected date and time. Please choose an upcoming trip.',
        });
      }

      // Check first-trip promo constraint if FIRSTRIDE or referral code is used
      if (promoCode) {
        const cleanPromo = String(promoCode).trim().toUpperCase();
        if (cleanPromo === 'FIRSTRIDE' || /FIRST/i.test(cleanPromo)) {
          const prior = await Booking.findOne({
            ...userBookingFilter(req),
            status: { $in: ['confirmed', 'pending'] },
          });
          if (prior) {
            return response.badReq(res, {
              message: `${cleanPromo} is only valid for first-time travelers on their initial booking.`,
            });
          }
        } else {
          const Campaign = require('@models/Campaign');
          const campaign = await Campaign.findOne({
            code: cleanPromo,
            status: 'active',
            ...tenantFilter(req),
          });

          if (campaign) {
            if (
              campaign.operator &&
              campaign.operator.trim().toLowerCase() !== 'all' &&
              campaign.operator.trim().toLowerCase() !== 'admin' &&
              campaign.operator.trim().toLowerCase() !== 'alagare'
            ) {
              const routeOp = (route.operator || '').trim().toLowerCase();
              const campaignOp = campaign.operator.trim().toLowerCase();
              if (routeOp && routeOp !== campaignOp) {
                return response.badReq(res, {
                  message: `This promo code is only valid for ${campaign.operator} trips.`,
                });
              }
            }
            if (campaign.routeId && campaign.routeId !== 'all' && campaign.routeId !== route.routeId) {
              return response.badReq(res, {
                message: 'Promo code is not applicable for this route.',
              });
            }
          } else {
            const friend = await User.findOne({ referralCode: cleanPromo });
            if (friend) {
              const currentUser = await User.findById(req.user?._id);
              const isLinkedReferral = currentUser?.referredBy && currentUser.referredBy.toString() === friend._id.toString();
              if (!isLinkedReferral) {
                return response.badReq(res, {
                  message: 'Referral codes must be applied during Sign Up. You are not linked to this referral code.',
                });
              }
              const prior = await Booking.findOne({
                ...userBookingFilter(req),
                status: { $in: ['confirmed', 'pending'] },
              });
              if (prior) {
                return response.badReq(res, {
                  message: 'Referral discount is only valid on your first booking.',
                });
              }
            }
          }
        }
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

      const pricingSettings = await getEffectivePlatformPricing(req, route.operator);
      const bookingRef = `ALG-${Date.now().toString(36).toUpperCase()}`;
      const seatCount = seatList.length || Number(passengers) || 1;
      const pricing = priceBreakdown(
        route,
        seatCount,
        pricingSettings.commissionRate,
        pricingSettings.taxRate,
        pricingSettings.serviceFee,
      );
      let finalAmount = Number(amount) || pricing.total;
      if (discountAmount > 0 && !amount) {
        finalAmount = Math.max(0, Math.round((pricing.total - Number(discountAmount)) * 100) / 100);
      }
      pricing.discount = Number(discountAmount) || 0;
      pricing.total = finalAmount;

      const booking = await Booking.create({
        ref: bookingRef,
        user: req.user?._id,
        passenger: passengerName || req.user?.fullname || (finalContactEmail.includes('@alagare.com') ? (phone || req.user?.phone || 'Passenger') : finalContactEmail.split('@')[0]),
        email: finalContactEmail,
        phone: phone || req.user?.phone || '',
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
        operatorBaseFare: pricing.operatorBaseFare,
        commissionRate: pricing.commissionRate,
        commissionAmount: pricing.commissionAmount,
        taxRate: pricing.taxRate,
        taxAmount: pricing.taxes,
        serviceFee: pricing.serviceFee,
        promoCode: promoCode ? String(promoCode).trim().toUpperCase() : '',
        discountAmount: Number(discountAmount) || 0,
        amount: finalAmount,
        status: 'confirmed',
        paymentMethod: paymentMethod || 'stripe',
        paymentIntentId: paymentIntentId || '',
        paymentStatus: paymentStatus || 'paid',
        api_user: req.apiUser._id,
      });

      // Deduct travel credit if referral code or travel credit was used
      if (promoCode && Number(discountAmount) > 0 && req.user?._id) {
        const cleanPromo = String(promoCode).trim().toUpperCase();
        const isCreditCode = cleanPromo === 'TRAVELCREDIT' || cleanPromo === 'CREDIT' || cleanPromo === 'REFERRAL';
        const friend = await User.findOne({ referralCode: cleanPromo });
        if (isCreditCode || friend) {
          const u = await User.findById(req.user._id);
          if (u && (u.travelCredit || 0) > 0) {
            u.travelCredit = Math.max(0, (u.travelCredit || 0) - Number(discountAmount));
            await u.save();
          }
        }
      }

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
      const filter = userBookingFilter(req);
      const bookings = await Booking.find(filter).sort({ createdAt: -1 });

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
      const filter = userBookingFilter(req);
      const booking = await Booking.findOne({
        ref: req.params.bookingRef,
        ...filter,
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
      const HomeContent = require('@models/HomeContent');
      const User = require('@models/User');
      const promoCode = String(code).trim().toUpperCase();
      const amount = Number(totalAmount) || 0;

      // Helper to check if the user has any prior active/confirmed trips
      const hasPriorConfirmedTrips = async () => {
        const filter = userBookingFilter(req);
        const prior = await Booking.findOne({
          ...filter,
          status: { $in: ['confirmed', 'pending'] },
        });
        return !!prior;
      };

      // 1. Check Operator / Admin Campaigns
      const campaign = await Campaign.findOne({
        code: promoCode,
        status: 'active',
        ...tenantFilter(req),
      });

      if (campaign) {
        let selectedRoute = null;
        if (routeId) {
          const mongoose = require('mongoose');
          const isObjId = mongoose.Types.ObjectId.isValid(routeId);
          selectedRoute = await BusRoute.findOne({
            $or: [
              { routeId },
              ...(isObjId ? [{ _id: routeId }] : []),
            ],
            ...tenantFilter(req),
          });
          if (!selectedRoute) {
            selectedRoute = await BusRoute.findOne({
              $or: [
                { routeId },
                ...(isObjId ? [{ _id: routeId }] : []),
              ],
            });
          }
        }

        if (
          campaign.operator &&
          campaign.operator.trim().toLowerCase() !== 'all' &&
          campaign.operator.trim().toLowerCase() !== 'admin' &&
          campaign.operator.trim().toLowerCase() !== 'alagare'
        ) {
          const routeOp = ((selectedRoute && selectedRoute.operator) || '').trim().toLowerCase();
          const campaignOp = campaign.operator.trim().toLowerCase();
          if (routeOp && routeOp !== campaignOp) {
            return response.badReq(res, {
              message: `This promo code is only valid for ${campaign.operator} trips.`,
            });
          }
        }

        const cleanRouteId = selectedRoute?.routeId || routeId;
        if (campaign.routeId && campaign.routeId !== 'all' && cleanRouteId && campaign.routeId !== cleanRouteId) {
          return response.badReq(res, { message: 'Promo code is not applicable for this route' });
        }

        const isFirstOnly = campaign.isFirstTripOnly || promoCode === 'FIRSTRIDE' || /FIRST/i.test(campaign.code) || /FIRST/i.test(campaign.title || '');
        if (isFirstOnly) {
          const alreadyTravelled = await hasPriorConfirmedTrips();
          if (alreadyTravelled) {
            return response.badReq(res, {
              message: `${promoCode} is only valid for first-time travelers on their initial booking.`,
            });
          }
        }

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
      }

      // 2. Check App Home Promo Banner Code (FIRSTRIDE / Save 20% on First Trip)
      const home = await HomeContent.findOne({
        ...tenantFilter(req),
      });
      if (home && home.promoCode && home.promoCode.trim().toUpperCase() === promoCode) {
        const isFirstOnly = promoCode === 'FIRSTRIDE' || /FIRST/i.test(home.promoTitle || '') || /FIRST/i.test(home.promoCode || '') || /FIRST/i.test(home.promoDesc || '');
        if (isFirstOnly) {
          const alreadyTravelled = await hasPriorConfirmedTrips();
          if (alreadyTravelled) {
            return response.badReq(res, {
              message: `${promoCode} is only valid for first-time travelers on their initial booking.`,
            });
          }
        }

        const discountPercent = 20;
        const discount = Math.round(((amount * discountPercent) / 100) * 100) / 100;
        const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100);

        return response.ok(res, {
          message: 'Promo banner discount applied!',
          code: promoCode,
          title: home.promoTitle || 'Special Offer',
          discountPercent,
          discount,
          finalAmount,
        });
      }

      // 3. Check Friend Referral Code
      const friend = await User.findOne({
        referralCode: promoCode,
      });
      if (friend) {
        if (friend._id.toString() === req.user?._id?.toString()) {
          return response.badReq(res, { message: 'You cannot use your own referral code at checkout.' });
        }

        // Referral codes can only be redeemed by the user who registered using this code
        const currentUser = await User.findById(req.user?._id);
        const isLinkedReferral = currentUser?.referredBy && currentUser.referredBy.toString() === friend._id.toString();

        if (!isLinkedReferral) {
          return response.badReq(res, {
            message: 'Referral codes must be applied during Sign Up. You are not linked to this referral code.',
          });
        }

        const alreadyTravelled = await hasPriorConfirmedTrips();
        if (alreadyTravelled) {
          return response.badReq(res, {
            message: 'Referral discount is only valid on your first booking.',
          });
        }

        const availableCredit = currentUser?.travelCredit || 0;
        if (availableCredit <= 0) {
          return response.badReq(res, {
            message: 'Your €10 referral travel credit has already been used.',
          });
        }

        const discount = Math.min(10, Math.min(amount, availableCredit));
        const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100);

        return response.ok(res, {
          message: `Referral travel credit from ${friend.fullname} applied (€${discount})!`,
          code: promoCode,
          title: `Referral Credit (€${discount})`,
          discount,
          isReferralCredit: true,
          finalAmount,
        });
      }

      // 4. Check TRAVELCREDIT / CREDIT / REFERRAL (Allow users to redeem their earned travel credit balance)
      if (promoCode === 'TRAVELCREDIT' || promoCode === 'CREDIT' || promoCode === 'REFERRAL') {
        const currentUser = await User.findById(req.user?._id);
        const availableCredit = currentUser?.travelCredit || 0;
        if (availableCredit <= 0) {
          return response.badReq(res, {
            message: 'You do not have any travel credit available to redeem.',
          });
        }

        const discount = Math.min(availableCredit, amount);
        const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100);

        return response.ok(res, {
          message: `Travel credit of €${discount} applied!`,
          code: promoCode,
          title: `Travel Credit (€${discount})`,
          discount,
          isReferralCredit: true,
          finalAmount,
        });
      }

      return response.badReq(res, { message: 'Invalid or expired promo code' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  cancelBooking: async (req, res) => {
    try {
      const { bookingRef } = req.params;
      const filter = userBookingFilter(req);
      const booking = await Booking.findOne({
        ref: bookingRef,
        ...filter,
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
  isTripDeparted,
};
