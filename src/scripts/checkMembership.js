'use strict';
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Booking = require('../models/Booking');

(async () => {
  try {
    await connectDB();
    const users = await User.find({ role: { $ne: 'admin' } });
    console.log('=== USERS COUNT:', users.length);
    for (const u of users) {
      const matchQueries = [];
      if (u._id) matchQueries.push({ user: u._id });
      if (u.email) matchQueries.push({ email: u.email });
      if (u.phone) matchQueries.push({ phone: u.phone });
      const bCount = await Booking.countDocuments(matchQueries.length ? { $or: matchQueries } : {});
      console.log(`User: ${u.fullname} | Phone: ${u.phone} | DB Membership: ${u.membership} | Trips in DB: ${bCount} | api_user: ${u.api_user}`);
    }

    const allBookings = await Booking.find({});
    console.log('=== ALL BOOKINGS COUNT:', allBookings.length);
    for (const b of allBookings) {
      console.log(`Booking ${b.ref} | User: ${b.user} | Phone: ${b.phone} | Status: ${b.status} | api_user: ${b.api_user}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
