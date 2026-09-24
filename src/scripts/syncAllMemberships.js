'use strict';
require('module-alias/register');
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const { syncUserMembership } = require('../helper/membershipHelper');

(async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Starting full user membership sync...');

    const users = await User.find({ role: { $ne: 'admin' } });
    console.log(`Found ${users.length} registered user(s) to process.`);

    for (const u of users) {
      const res = await syncUserMembership(u);
      if (res) {
        console.log(`Synced User: ${u.fullname} (${u.phone || u.email}) -> Tier: ${res.membership}, Trips: ${res.totalTrips}, Points: ${res.totalPoints}, Total Spent: €${res.totalSpent}`);
      }
    }

    console.log('Membership sync completed successfully!');
  } catch (err) {
    console.error('Sync Error:', err);
  } finally {
    process.exit(0);
  }
})();
