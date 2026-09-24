'use strict';
const Operator = require('@models/Operator');
const Booking = require('@models/Booking');
const BusRoute = require('@models/BusRoute');
const User = require('@models/User');
const PlatformSettings = require('@models/PlatformSettings');
const response = require('@responses');
const { notifyUser } = require('@services/notification');
const { syncUserMembership, TIER_RANK, calculateTier } = require('../helper/membershipHelper');

const tenantFilter = (req) => ({ api_user: req.apiUser._id });

const toOperator = (o) => ({
  id: o._id,
  name: o.name,
  contact: o.contact,
  phone: o.phone,
  routes: o.routes,
  rating: o.rating,
  reviewCount: o.reviewCount || 0,
  description: o.description || '',
  logo: o.logo || '',
  commissionRate: o.commissionRate !== undefined && o.commissionRate !== null ? o.commissionRate : null,
  status: o.status,
});

const toBooking = (b) => ({
  id: b._id,
  ref: b.ref,
  passenger: b.passenger,
  email: b.email,
  route: b.route,
  routeId: b.routeId,
  operator: b.operator,
  date: b.date,
  departure: b.departure,
  arrival: b.arrival,
  seats: b.seats,
  seatKeys: b.seatKeys,
  amount: b.amount,
  operatorBaseFare: b.operatorBaseFare !== undefined && b.operatorBaseFare !== null ? b.operatorBaseFare : null,
  commissionRate: b.commissionRate !== undefined && b.commissionRate !== null ? b.commissionRate : null,
  commissionAmount: b.commissionAmount !== undefined && b.commissionAmount !== null ? b.commissionAmount : null,
  status: b.status,
  createdAt: b.createdAt,
});

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

module.exports = {
  getDashboard: async (req, res) => {
    try {
      const filter = tenantFilter(req);
      const today = startOfToday();

      const [bookings, routes, operators, users] = await Promise.all([
        Booking.find(filter).sort({ createdAt: -1 }),
        BusRoute.find(filter),
        Operator.find(filter),
        User.find({ ...filter, role: { $ne: 'admin' } }).select('-password'),
      ]);

      const paidStatuses = new Set(['pending', 'confirmed']);
      const totalRevenue = bookings
        .filter((b) => paidStatuses.has(b.status))
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

      const todayBookings = bookings.filter(
        (b) => b.createdAt && new Date(b.createdAt) >= today,
      ).length;
      const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
      const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
      const activeRoutes = routes.filter((r) => r.status === 'active').length;
      const activeOperators = operators.filter((o) => o.status === 'active').length;

      return response.ok(res, {
        stats: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalBookings: bookings.length,
          todayBookings,
          pendingBookings,
          confirmedBookings,
          activeRoutes,
          totalRoutes: routes.length,
          totalUsers: users.length,
          totalOperators: operators.length,
          activeOperators,
        },
        recentBookings: bookings.slice(0, 6).map(toBooking),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // ── Operators ──
  listOperators: async (req, res) => {
    try {
      const operators = await Operator.find(tenantFilter(req)).sort({ createdAt: -1 });
      return response.ok(res, { operators: operators.map(toOperator) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  createOperator: async (req, res) => {
    try {
      const { name, contact, phone, rating, status, description, reviewCount, logo, commissionRate } = req.body;
      if (!name || !contact || !phone) {
        return response.badReq(res, { message: 'name, contact and phone are required' });
      }
      const operator = await Operator.create({
        name,
        contact,
        phone,
        rating: rating != null ? Number(rating) : 0,
        reviewCount: reviewCount != null ? Number(reviewCount) : 0,
        description: description || '',
        logo: logo || '',
        commissionRate: commissionRate != null && commissionRate !== '' ? Number(commissionRate) : null,
        status: status || 'active',
        routes: 0,
        api_user: req.apiUser._id,
      });
      return response.created(res, { message: 'Operator created', operator: toOperator(operator) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateOperator: async (req, res) => {
    try {
      const { name, contact, phone, rating, status, routes, description, reviewCount, logo, commissionRate } =
        req.body;
      const update = {};
      if (name !== undefined) update.name = name;
      if (contact !== undefined) update.contact = contact;
      if (phone !== undefined) update.phone = phone;
      if (rating !== undefined) update.rating = Number(rating);
      if (reviewCount !== undefined) update.reviewCount = Number(reviewCount);
      if (description !== undefined) update.description = description;
      if (logo !== undefined) update.logo = logo;
      if (status !== undefined) update.status = status;
      if (routes !== undefined) update.routes = Number(routes);
      if (commissionRate !== undefined) {
        update.commissionRate = commissionRate !== null && commissionRate !== '' ? Number(commissionRate) : null;
      }

      const operator = await Operator.findOneAndUpdate(
        { _id: req.params.id, ...tenantFilter(req) },
        update,
        { new: true },
      );
      if (!operator) return response.notFound(res, { message: 'Operator not found' });
      return response.ok(res, { message: 'Operator updated', operator: toOperator(operator) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteOperator: async (req, res) => {
    try {
      const operator = await Operator.findOneAndDelete({
        _id: req.params.id,
        ...tenantFilter(req),
      });
      if (!operator) return response.notFound(res, { message: 'Operator not found' });
      return response.ok(res, { message: 'Operator deleted' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // ── Bookings ──
  listBookings: async (req, res) => {
    try {
      const bookings = await Booking.find(tenantFilter(req)).sort({ createdAt: -1 });
      return response.ok(res, { bookings: bookings.map(toBooking) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateBookingStatus: async (req, res) => {
    try {
      const { status } = req.body;
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return response.badReq(res, { message: 'Invalid status' });
      }
      const booking = await Booking.findOne({ _id: req.params.id, ...tenantFilter(req) });
      if (!booking) return response.notFound(res, { message: 'Booking not found' });
      
      const previousStatus = booking.status;
      booking.status = status;
      await booking.save();
      
      if (previousStatus !== status) {
        let user = null;
        if (booking.user) {
          user = await User.findById(booking.user);
        }
        if (!user && (booking.email || booking.phone)) {
          const match = [];
          if (booking.email) match.push({ email: (booking.email || '').toLowerCase().trim() });
          if (booking.phone) match.push({ phone: (booking.phone || '').trim() });
          if (match.length > 0) {
            user = await User.findOne({ $or: match });
          }
        }

        const title = status === 'confirmed'
          ? 'Booking Confirmed'
          : status === 'cancelled'
          ? 'Booking Cancelled'
          : 'Booking Status Updated';

        const content = status === 'confirmed'
          ? `Your booking ${booking.ref} for ${booking.route} has been confirmed.`
          : status === 'cancelled'
          ? `Your booking ${booking.ref} for ${booking.route} has been cancelled.`
          : `Your booking ${booking.ref} for ${booking.route} status is now ${status}.`;

        const category = status === 'confirmed' ? 'bookingConfirmed' : 'tripUpdates';

        if (user) {
          await notifyUser(user, category, title, content).catch((e) => console.error('Notification error:', e));
          await syncUserMembership(user).catch(() => {});
        }
      }

      return response.ok(res, { message: 'Booking updated', booking: toBooking(booking) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  listUsers: async (req, res) => {
    try {
      const users = await User.find({ ...tenantFilter(req), isDeleted: { $ne: true }, role: { $ne: 'admin' } })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();
      const bookings = await Booking.find({}).lean();

      const formatted = users.map((u) => {
        const uId = String(u._id);
        const uEmail = (u.email || '').toLowerCase().trim();
        const uPhone = (u.phone || '').trim();
        const uDigits = uPhone.replace(/\D/g, '');

        const userBookings = bookings.filter((b) => {
          if (b.user && String(b.user) === uId) return true;
          if (uEmail && b.email && b.email.toLowerCase().trim() === uEmail) return true;
          if (uPhone && b.phone && b.phone.trim() === uPhone) return true;
          if (uDigits && uDigits.length >= 7 && b.phone) {
            const bDigits = String(b.phone).replace(/\D/g, '');
            if (bDigits.endsWith(uDigits.slice(-10)) || uDigits.endsWith(bDigits.slice(-10))) return true;
          }
          return false;
        });

        const totalTrips = userBookings.length;
        const confirmedCount = userBookings.filter((b) => b.status === 'confirmed').length;
        const totalSpent = userBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const calculatedPoints = (confirmedCount > 0 ? confirmedCount : totalTrips) * 150 + Math.round(totalSpent * 2);
        const totalPoints = Math.max(Number(u.travelPoints) || 0, calculatedPoints);

        const member = u.membership || calculateTier(totalTrips, totalPoints) || 'Standard';

        return {
          id: u._id,
          _id: u._id,
          name: u.fullname || u.name || 'User',
          email: u.email || '',
          phone: u.phone || 'N/A',
          member: member,
          status: u.isBlocked ? 'inactive' : 'active',
          trips: totalTrips,
          points: totalPoints,
          joined: u.createdAt
            ? new Date(u.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        };
      });

      return response.ok(res, { users: formatted });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateUser: async (req, res) => {
    try {
      const { name, fullname, email, phone, member, membership, status } = req.body;
      const updateData = {
        ...(name || fullname ? { fullname: fullname || name } : {}),
        ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
        ...(member || membership ? { membership: member || membership } : {}),
        ...(status !== undefined ? { isBlocked: status === 'inactive' } : {}),
      };

      const updateQuery = { $set: updateData };
      if (email && String(email).trim()) {
        updateData.email = String(email).toLowerCase().trim();
      } else if (email === '' || email === null) {
        updateQuery.$unset = { email: 1 };
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateQuery,
        { new: true }
      ).select('-password');
      if (!user) return response.notFound(res, { message: 'User not found' });
      return response.ok(res, {
        message: 'User updated',
        user: {
          id: user._id,
          name: user.fullname,
          email: user.email,
          phone: user.phone,
          member: user.membership || 'Standard',
          status: user.isBlocked ? 'inactive' : 'active',
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true },
        { new: true }
      );
      if (!user) return response.notFound(res, { message: 'User not found' });
      return response.ok(res, { message: 'User removed successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getCommissionReport: async (req, res) => {
    try {
      const filter = tenantFilter(req);
      const settings = await PlatformSettings.findOne(filter);
      const globalCommissionRate = settings?.commissionRate != null ? Number(settings.commissionRate) : 5;

      const bookings = await Booking.find(filter).sort({ createdAt: -1 });
      const confirmedBookings = bookings.filter((b) => b.status !== 'cancelled');

      let totalGross = 0;
      let totalCommission = 0;
      let totalOperatorPayout = 0;

      const operatorStatsMap = {};

      const commissionBookings = confirmedBookings.map((b) => {
        const totalPaid = Number(b.amount) || 0;
        let commRate = b.commissionRate != null && b.commissionRate > 0 ? Number(b.commissionRate) : globalCommissionRate;
        let commAmount = Number(b.commissionAmount) || 0;
        let baseFare = Number(b.operatorBaseFare) || 0;

        if (commAmount === 0 && totalPaid > 0) {
          commAmount = Math.round((totalPaid * (commRate / 100)) * 100) / 100;
          baseFare = Math.max(0, Math.round((totalPaid - commAmount) * 100) / 100);
        } else if (baseFare === 0 && totalPaid > 0) {
          baseFare = Math.max(0, Math.round((totalPaid - commAmount) * 100) / 100);
        }

        totalGross += totalPaid;
        totalCommission += commAmount;
        totalOperatorPayout += baseFare;

        const opName = b.operator || 'Standard Operator';
        if (!operatorStatsMap[opName]) {
          operatorStatsMap[opName] = {
            operator: opName,
            operatorName: opName,
            bookingsCount: 0,
            seatsCount: 0,
            totalSeats: 0,
            grossAmount: 0,
            grossVolume: 0,
            commissionEarned: 0,
            operatorPayout: 0,
            commissionRate: commRate,
          };
        }
        operatorStatsMap[opName].bookingsCount += 1;
        const seatCount = Number(b.seats) || 1;
        operatorStatsMap[opName].seatsCount += seatCount;
        operatorStatsMap[opName].totalSeats += seatCount;
        operatorStatsMap[opName].grossVolume = Math.round((operatorStatsMap[opName].grossVolume + totalPaid) * 100) / 100;
        operatorStatsMap[opName].grossAmount = operatorStatsMap[opName].grossVolume;
        operatorStatsMap[opName].commissionEarned = Math.round((operatorStatsMap[opName].commissionEarned + commAmount) * 100) / 100;
        operatorStatsMap[opName].operatorPayout = Math.round((operatorStatsMap[opName].operatorPayout + baseFare) * 100) / 100;

        return {
          id: String(b._id),
          ref: b.ref,
          bookingRef: b.ref,
          passenger: b.passenger,
          operator: b.operator || 'Standard Operator',
          route: b.route,
          date: b.date,
          departure: b.departure,
          seats: b.seats,
          operatorBaseFare: baseFare,
          commissionRate: commRate,
          commissionAmount: commAmount,
          amount: totalPaid,
          status: b.status,
          paymentMethod: b.paymentMethod,
          createdAt: b.createdAt,
        };
      });

      return response.ok(res, {
        globalCommissionRate,
        summary: {
          totalGross: Math.round(totalGross * 100) / 100,
          totalGrossAmount: Math.round(totalGross * 100) / 100,
          totalCommission: Math.round(totalCommission * 100) / 100,
          totalCommissionEarned: Math.round(totalCommission * 100) / 100,
          totalOperatorPayout: Math.round(totalOperatorPayout * 100) / 100,
          totalOperatorPayouts: Math.round(totalOperatorPayout * 100) / 100,
          totalBookings: confirmedBookings.length,
          totalBookingsCount: confirmedBookings.length,
          activeOperatorsCount: Object.keys(operatorStatsMap).length,
          defaultCommissionRate: globalCommissionRate,
        },
        operatorStats: Object.values(operatorStatsMap),
        bookings: commissionBookings,
      });
    } catch (error) {
      console.error('Commission report error:', error);
      return response.error(res, error);
    }
  },
};
