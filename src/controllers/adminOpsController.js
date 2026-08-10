'use strict';
const Operator = require('@models/Operator');
const Booking = require('@models/Booking');
const BusRoute = require('@models/BusRoute');
const User = require('@models/User');
const response = require('@responses');

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
  seats: b.seats,
  seatKeys: b.seatKeys,
  amount: b.amount,
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
      const { name, contact, phone, rating, status, description, reviewCount, logo } = req.body;
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
      const { name, contact, phone, rating, status, routes, description, reviewCount, logo } =
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
      
      const prevStatus = booking.status;
      booking.status = status;
      await booking.save();
      
      if (booking.routeId && booking.seatKeys && booking.seatKeys.length > 0 && prevStatus !== status) {
        const route = await BusRoute.findOne({ routeId: booking.routeId });
        if (route) {
          if (status === 'cancelled') {
            route.occupiedSeats = (route.occupiedSeats || []).filter(s => !booking.seatKeys.includes(s));
          } else if (status === 'confirmed' || status === 'pending') {
            route.occupiedSeats = [...new Set([...(route.occupiedSeats || []), ...booking.seatKeys])];
          }
          route.seatsAvailable = Math.max(0, (route.seats || 40) - route.occupiedSeats.length);
          await route.save();
        }
      }
      return response.ok(res, { message: 'Booking updated', booking: toBooking(booking) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  listUsers: async (req, res) => {
    try {
      const users = await User.find({ ...tenantFilter(req), isDeleted: { $ne: true }, role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
      const bookings = await Booking.find(tenantFilter(req));
      
      const statsMap = {};
      bookings.forEach(b => {
        const email = (b.email || '').toLowerCase().trim();
        if (!statsMap[email]) statsMap[email] = { totalTrips: 0, confirmedCount: 0, totalSpent: 0 };
        statsMap[email].totalTrips += 1;
        if (b.status === 'confirmed') statsMap[email].confirmedCount += 1;
        statsMap[email].totalSpent += (b.amount || 0);
      });

      const formatted = users.map((u) => {
        const email = (u.email || '').toLowerCase().trim();
        const stats = statsMap[email] || { totalTrips: 0, confirmedCount: 0, totalSpent: 0 };
        const totalPoints = (stats.confirmedCount > 0 ? stats.confirmedCount : stats.totalTrips) * 150 + Math.round(stats.totalSpent * 2);

        let member = u.membership;
        if (!member || member === 'Standard') {
           if (stats.totalTrips >= 5) member = 'Platinum';
           else if (stats.totalTrips >= 2) member = 'Gold';
           else member = 'Standard';
        }
        if (u.role === 'operator') member = 'Gold';

        return {
          id: u._id,
          _id: u._id,
          name: u.fullname || u.name || 'User',
          email: u.email,
          phone: u.phone || 'N/A',
          member: member,
          status: u.isBlocked ? 'inactive' : 'active',
          trips: stats.totalTrips,
          points: totalPoints,
          joined: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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
      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          ...(name || fullname ? { fullname: fullname || name } : {}),
          ...(email ? { email: email.toLowerCase().trim() } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(member || membership ? { membership: member || membership } : {}),
          ...(status !== undefined ? { isBlocked: status === 'inactive' } : {}),
        },
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
};
