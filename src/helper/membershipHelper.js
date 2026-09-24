'use strict';
const User = require('@models/User');
const Booking = require('@models/Booking');

const TIER_RANK = { standard: 0, silver: 1, gold: 2, platinum: 3 };

const calculateTier = (trips) => {
  const t = Number(trips) || 0;
  if (t >= 11) return 'Platinum';
  if (t >= 6) return 'Gold';
  if (t >= 3) return 'Silver';
  return 'Standard';
};

const syncUserMembership = async (userOrId) => {
  try {
    if (!userOrId) return null;
    let user = null;
    if (typeof userOrId === 'object' && userOrId._id) {
      user = userOrId;
    } else {
      user = await User.findById(userOrId);
    }
    if (!user) return null;

    const uId = String(user._id);
    const uEmail = (user.email || '').toLowerCase().trim();
    const uPhone = (user.phone || '').trim();
    const uDigits = uPhone.replace(/\D/g, '');
    const uName = (user.fullname || '').toLowerCase().trim();

    const matchQueries = [];
    if (user._id) matchQueries.push({ user: user._id });
    if (uEmail) {
      matchQueries.push({ email: { $regex: new RegExp('^' + uEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
    }
    if (uPhone) {
      matchQueries.push({ phone: uPhone });
    }
    if (uDigits && uDigits.length >= 7) {
      matchQueries.push({ phone: { $regex: new RegExp(uDigits.slice(-10) + '$') } });
    }
    if (uName) {
      matchQueries.push({ passenger: { $regex: new RegExp('^' + uName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
    }

    const bookings = await Booking.find(matchQueries.length > 0 ? { $or: matchQueries } : { user: user._id });

    const totalTrips = bookings.length;
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
    const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const calculatedPoints = (confirmedCount > 0 ? confirmedCount : totalTrips) * 150 + Math.round(totalSpent * 2);
    const totalPoints = Math.max(Number(user.travelPoints) || 0, calculatedPoints);

    const effectiveTier = calculateTier(totalTrips);

    // Persist to MongoDB if changed
    const needsUpdate = user.membership !== effectiveTier || user.travelPoints !== totalPoints;
    if (needsUpdate) {
      await User.findByIdAndUpdate(user._id, {
        membership: effectiveTier,
        travelPoints: totalPoints,
      });
      user.membership = effectiveTier;
      user.travelPoints = totalPoints;
    }

    return {
      user,
      totalTrips,
      totalPoints,
      totalSpent,
      membership: effectiveTier,
    };
  } catch (error) {
    console.error('syncUserMembership error:', error);
    return null;
  }
};

module.exports = {
  TIER_RANK,
  calculateTier,
  syncUserMembership,
};
