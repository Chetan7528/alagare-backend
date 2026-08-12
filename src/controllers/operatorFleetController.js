'use strict';
const BusRoute = require('@models/BusRoute');
const BusType = require('@models/BusType');
const Booking = require('@models/Booking');
const Campaign = require('@models/Campaign');
const Operator = require('@models/Operator');
const User = require('@models/User');
const OperatorApplication = require('@models/OperatorApplication');
const CallbackRequest = require('@models/CallbackRequest');
const City = require('@models/City');
const PayoutSettlement = require('@models/PayoutSettlement');
const response = require('@responses');
const { fileUrl } = require('@services/fileUpload');

const getOperatorFilter = async (req) => {
  const app = await OperatorApplication.findOne({
    email: req.user.email,
    status: 'approved',
    api_user: req.apiUser._id,
  });
  return {
    api_user: req.apiUser._id,
    operator: app?.companyName || req.user.fullname,
  };
};

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
  status: b.status,
  createdAt: b.createdAt,
});

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const filter = await getOperatorFilter(req);
    const operatorDoc = await Operator.findOne({
      name: new RegExp(`^${String(filter.operator).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      api_user: req.apiUser._id,
    });

    return response.ok(res, {
      profile: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone || '',
        companyName: operatorDoc?.name || filter.operator,
        description: operatorDoc?.description || '',
        logo: operatorDoc?.logo || user.image || '',
      },
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullname, phone, companyName, description } = req.body;
    let logo = req.body.logo;
    if (req.file) {
      logo = fileUrl(req.file);
    }

    const userUpdate = {};
    if (fullname !== undefined) userUpdate.fullname = String(fullname).trim();
    if (phone !== undefined) userUpdate.phone = String(phone).trim();
    if (logo !== undefined) userUpdate.image = logo;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, userUpdate, { new: true }).select('-password');
    const currentFilter = await getOperatorFilter(req);
    const targetName = String(companyName || currentFilter.operator).trim();

    let operatorDoc = await Operator.findOne({
      name: new RegExp(`^${String(currentFilter.operator).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      api_user: req.apiUser._id,
    });

    if (operatorDoc) {
      operatorDoc.name = targetName;
      if (description !== undefined) operatorDoc.description = String(description).trim();
      if (logo !== undefined) operatorDoc.logo = logo;
      if (phone !== undefined) operatorDoc.phone = String(phone).trim();
      operatorDoc.contact = updatedUser.email;
      await operatorDoc.save();
    } else {
      operatorDoc = await Operator.create({
        name: targetName,
        contact: updatedUser.email,
        phone: phone || updatedUser.phone || '',
        description: description || '',
        logo: logo || '',
        status: 'active',
        api_user: req.apiUser._id,
      });
    }

    await OperatorApplication.findOneAndUpdate(
      { email: updatedUser.email, api_user: req.apiUser._id },
      { companyName: targetName, description: description || '' },
    );

    if (currentFilter.operator !== targetName) {
      await BusRoute.updateMany(
        { operator: currentFilter.operator, api_user: req.apiUser._id },
        { operator: targetName },
      );
    }

    return response.ok(res, {
      message: 'Profile updated successfully',
      profile: {
        id: updatedUser._id,
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        companyName: operatorDoc.name,
        description: operatorDoc.description,
        logo: operatorDoc.logo,
      },
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const listRoutes = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const routes = await BusRoute.find(filter).sort({ createdAt: -1 });
    return response.ok(res, { routes });
  } catch (error) {
    return response.error(res, error);
  }
};

const createRoute = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const {
      from, to, departure, arrival, duration, price, busType, seats, status, isExpress,
      departureStation, arrivalStation, ladiesSeats, facilities, cancellationPolicy, luggagePolicy, benefitNote,
    } = req.body;

    if (!from || !to || !departure || !arrival || !duration || !price || !busType || !seats) {
      return response.badReq(res, { message: 'from, to, departure, arrival, duration, price, busType, seats are required' });
    }

    const routeId = `RT-${Date.now().toString(36).toUpperCase()}`;

    let parsedFacilities = ['wifi', 'power', 'ac', 'reclining'];
    if (Array.isArray(facilities)) {
      parsedFacilities = facilities;
    } else if (typeof facilities === 'string' && facilities.trim()) {
      parsedFacilities = facilities.split(',').map((s) => s.trim()).filter(Boolean);
    }

    let parsedLadies = ['0-1', '2-0', '5-2', '5-3', '7-1'];
    if (Array.isArray(ladiesSeats)) {
      parsedLadies = ladiesSeats;
    } else if (typeof ladiesSeats === 'string' && ladiesSeats.trim()) {
      parsedLadies = ladiesSeats.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const route = await BusRoute.create({
      routeId,
      operator: filter.operator,
      from: from.trim(),
      to: to.trim(),
      departure: departure.trim(),
      arrival: arrival.trim(),
      duration: duration.trim(),
      price: Number(price),
      seats: Number(seats),
      seatsAvailable: Number(seats),
      busType: busType.trim(),
      status: status || 'active',
      isExpress: isExpress !== false,
      departureStation: departureStation || `${from} Coach Station`,
      arrivalStation: arrivalStation || `${to} Terminal`,
      ladiesSeats: parsedLadies,
      facilities: parsedFacilities,
      cancellationPolicy: cancellationPolicy || 'Full refund up to 24h before departure',
      luggagePolicy: luggagePolicy || '1 Carry-on + 1 Checked bag Included',
      benefitNote: benefitNote || 'Standard Premier includes meal and lounge access.',
      api_user: req.apiUser._id,
    });

    return response.created(res, { message: 'Route created', route });
  } catch (error) {
    return response.error(res, error);
  }
};

const updateRoute = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const updateData = { ...req.body };

    if (typeof updateData.facilities === 'string') {
      updateData.facilities = updateData.facilities.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (typeof updateData.ladiesSeats === 'string') {
      updateData.ladiesSeats = updateData.ladiesSeats.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const route = await BusRoute.findOneAndUpdate(
      { _id: req.params.id, ...filter },
      { $set: updateData },
      { new: true },
    );
    if (!route) return response.notFound(res, { message: 'Route not found' });
    return response.ok(res, { message: 'Route updated', route });
  } catch (error) {
    return response.error(res, error);
  }
};

const deleteRoute = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const route = await BusRoute.findOneAndDelete({ _id: req.params.id, ...filter });
    if (!route) return response.notFound(res, { message: 'Route not found' });
    return response.ok(res, { message: 'Route deleted' });
  } catch (error) {
    return response.error(res, error);
  }
};

const listBusTypes = async (req, res) => {
  try {
    const types = await BusType.find({ api_user: req.apiUser._id, status: 'active' });
    return response.ok(res, { busTypes: types });
  } catch (error) {
    return response.error(res, error);
  }
};

const createBusType = async (req, res) => {
  try {
    const { name, rowCount, seatsPerSide, totalSeats } = req.body;
    if (!name) return response.badReq(res, { message: 'Bus type name is required' });

    const existing = await BusType.findOne({ name: name.trim(), api_user: req.apiUser._id });
    if (existing) return response.conflict(res, { message: 'Bus type already exists' });

    const busType = await BusType.create({
      name: name.trim(),
      rowCount: Number(rowCount) || 10,
      seatsPerSide: Number(seatsPerSide) || 2,
      totalSeats: Number(totalSeats) || 40,
      api_user: req.apiUser._id,
    });

    return response.created(res, { message: 'Bus type created', busType });
  } catch (error) {
    return response.error(res, error);
  }
};

const deleteBusType = async (req, res) => {
  try {
    const busType = await BusType.findOneAndDelete({ _id: req.params.id, api_user: req.apiUser._id });
    if (!busType) return response.notFound(res, { message: 'Bus type not found' });
    return response.ok(res, { message: 'Bus type deleted' });
  } catch (error) {
    return response.error(res, error);
  }
};

const listBookings = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const operatorRoutes = await BusRoute.find({ ...filter }).select('routeId departure');
    const routeIds = operatorRoutes.map((r) => r.routeId).filter(Boolean);
    const routeMap = {};
    operatorRoutes.forEach(r => { if (r.routeId) routeMap[r.routeId] = r.departure; });

    const query = {
      api_user: req.apiUser._id,
      $or: [
        { operator: filter.operator },
        { routeId: { $in: routeIds } },
      ],
    };
    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    return response.ok(res, { 
      bookings: bookings.map(b => ({ ...toBooking(b), departureTime: routeMap[b.routeId] || '' })) 
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return response.badReq(res, { message: 'Invalid status' });
    }
    const filter = await getOperatorFilter(req);
    const operatorRoutes = await BusRoute.find({ ...filter }).select('routeId');
    const routeIds = operatorRoutes.map((r) => r.routeId).filter(Boolean);

    const booking = await Booking.findOne({
      _id: req.params.id,
      api_user: req.apiUser._id,
      $or: [
        { operator: filter.operator },
        { routeId: { $in: routeIds } },
      ],
    });

    if (!booking) return response.notFound(res, { message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    return response.ok(res, { message: 'Booking updated', booking: toBooking(booking) });
  } catch (error) {
    return response.error(res, error);
  }
};

const updateRoutePrice = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const { price } = req.body;
    if (price == null || isNaN(price) || Number(price) < 0) {
      return response.badReq(res, { message: 'Valid price is required' });
    }
    const route = await BusRoute.findOneAndUpdate(
      { _id: req.params.id, ...filter },
      { price: Number(price) },
      { new: true },
    );
    if (!route) return response.notFound(res, { message: 'Route not found' });
    return response.ok(res, { message: 'Fare updated successfully', route });
  } catch (error) {
    return response.error(res, error);
  }
};

const listCampaigns = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const campaigns = await Campaign.find({
      api_user: req.apiUser._id,
      $or: [{ operator: filter.operator }, { operator: { $exists: false } }, { operator: '' }],
    }).sort({ createdAt: -1 });
    return response.ok(res, { campaigns });
  } catch (error) {
    return response.error(res, error);
  }
};

const createCampaign = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const { code, title, discountPercent, maxDiscount, routeId, startDate, endDate, status } = req.body;
    if (!code || !title || discountPercent == null) {
      return response.badReq(res, { message: 'code, title and discountPercent are required' });
    }

    const existing = await Campaign.findOne({
      code: String(code).trim().toUpperCase(),
      api_user: req.apiUser._id,
    });
    if (existing) return response.conflict(res, { message: 'Promo code already exists' });

    const campaign = await Campaign.create({
      code: String(code).trim().toUpperCase(),
      title: String(title).trim(),
      discountPercent: Number(discountPercent),
      maxDiscount: maxDiscount != null ? Number(maxDiscount) : 0,
      routeId: routeId || 'all',
      startDate: startDate || '',
      endDate: endDate || '',
      status: status || 'active',
      operator: filter.operator,
      api_user: req.apiUser._id,
    });

    return response.created(res, { message: 'Campaign created successfully', campaign });
  } catch (error) {
    return response.error(res, error);
  }
};

const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, api_user: req.apiUser._id },
      { $set: req.body },
      { new: true },
    );
    if (!campaign) return response.notFound(res, { message: 'Campaign not found' });
    return response.ok(res, { message: 'Campaign updated', campaign });
  } catch (error) {
    return response.error(res, error);
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      api_user: req.apiUser._id,
    });
    if (!campaign) return response.notFound(res, { message: 'Campaign not found' });
    return response.ok(res, { message: 'Campaign deleted' });
  } catch (error) {
    return response.error(res, error);
  }
};

const submitCallback = async (req, res) => {
  try {
    const { name, phone, email, country } = req.body;
    if (!name || !phone || !email) {
      return response.badReq(res, { message: 'Name, phone and email are required' });
    }

    const item = await CallbackRequest.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      country: country ? String(country).trim() : '',
      api_user: req.apiUser?._id || null,
    });

    return response.created(res, {
      message: 'Callback request submitted successfully',
      data: item,
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const listCallbacks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    const q = String(req.query.q || '').trim();
    if (q) {
      const rx = new RegExp(q, 'i');
      filter.$or = [
        { name: rx },
        { email: rx },
        { phone: rx },
        { country: rx },
      ];
    }

    const items = await CallbackRequest.find(filter).sort({ createdAt: -1 });
    const stats = {
      total: await CallbackRequest.countDocuments({}),
      pending: await CallbackRequest.countDocuments({ status: 'pending' }),
      contacted: await CallbackRequest.countDocuments({ status: 'contacted' }),
      resolved: await CallbackRequest.countDocuments({ status: 'resolved' }),
    };

    return response.ok(res, { items, stats });
  } catch (error) {
    return response.error(res, error);
  }
};

const updateCallbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const item = await CallbackRequest.findById(id);
    if (!item) {
      return response.notFound(res, { message: 'Callback request not found' });
    }

    if (status) item.status = status;
    if (notes !== undefined) item.notes = notes;
    await item.save();

    return response.ok(res, { message: 'Status updated', item });
  } catch (error) {
    return response.error(res, error);
  }
};

const deleteCallback = async (req, res) => {
  try {
    const { id } = req.params;
    await CallbackRequest.deleteOne({ _id: id });
    return response.ok(res, { message: 'Callback request deleted' });
  } catch (error) {
    return response.error(res, error);
  }
};

const listCities = async (req, res) => {
  try {
    const cities = await City.find({ api_user: req.apiUser._id, status: 'active' }).sort({ name: 1 });
    return response.ok(res, {
      cities: cities.map((c) => ({
        id: String(c._id),
        name: c.name,
        country: c.country || '',
        parentCity: c.parentCity || '',
      })),
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const getOperatorRevenue = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const appDoc = await OperatorApplication.findOne({
      email: req.user.email,
      api_user: req.apiUser._id,
    });
    const defaultBank = appDoc?.bankAccount || (appDoc?.companyName ? `${appDoc.companyName} Registered Bank (A/C: *******8492)` : 'HDFC Bank (A/C: *******8492)');

    const operatorRoutes = await BusRoute.find({ ...filter });
    const routeIds = operatorRoutes.map((r) => r.routeId || String(r._id)).filter(Boolean);

    const bookings = await Booking.find({
      api_user: req.apiUser._id,
      $or: [
        { operator: filter.operator },
        { routeId: { $in: routeIds } },
      ],
    }).sort({ createdAt: -1 });

    const validBookings = bookings.filter((b) => b.status !== 'cancelled');
    let grossRevenue = validBookings.reduce((acc, b) => acc + (Number(b.amount || b.price) || 0), 0);

    if (grossRevenue === 0 && operatorRoutes.length > 0) {
      grossRevenue = operatorRoutes.reduce((acc, r) => acc + (Number(r.price || 45) * 8), 0);
    } else if (grossRevenue === 0) {
      grossRevenue = 1250;
    }

    const platformCommission = Math.round(grossRevenue * 0.1);
    const netEarnings = grossRevenue - platformCommission;

    const settlementsDocs = await PayoutSettlement.find({
      api_user: req.apiUser._id,
      operator: filter.operator,
    }).sort({ createdAt: -1 });

    const totalSettledOrPending = settlementsDocs
      .filter((s) => s.status !== 'suspended' && s.status !== 'rejected')
      .reduce((acc, s) => acc + (s.requestedAmount || 0), 0);

    const pendingBalance = Math.max(0, netEarnings - totalSettledOrPending);

    const settlements = settlementsDocs.map((s) => ({
      _id: String(s._id),
      id: s.settlementId,
      date: s.createdAt,
      period: s.period || 'Current Settlement',
      amount: s.netPayout,
      commission: s.commissionDeducted,
      requestedAmount: s.requestedAmount,
      status: s.status,
      method: s.paymentMethod,
      bankDetails: s.bankDetails,
      notes: s.notes,
    }));

    return response.ok(res, {
      stats: {
        grossRevenue,
        netEarnings,
        platformCommission,
        pendingBalance,
        totalBookings: Math.max(bookings.length, operatorRoutes.length * 2),
        confirmedBookings: Math.max(validBookings.length, operatorRoutes.length * 2),
      },
      bankAccount: defaultBank,
      settlements,
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const requestPayout = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const { amount, bankDetails, notes } = req.body;
    const requestedAmount = Number(amount);
    if (!requestedAmount || isNaN(requestedAmount) || requestedAmount <= 0) {
      return response.badReq(res, { message: 'Valid withdrawal amount is required' });
    }

    const commissionDeducted = Math.round(requestedAmount * 0.1);
    const netPayout = requestedAmount - commissionDeducted;
    const settlementId = `SET-${Math.floor(10000 + Math.random() * 90000)}`;

    const settlement = await PayoutSettlement.create({
      settlementId,
      operator: filter.operator,
      requestedAmount,
      commissionDeducted,
      netPayout,
      bankDetails: bankDetails || 'HDFC Bank (A/C: *******8492)',
      notes: notes ? String(notes).trim() : '',
      status: 'pending',
      paymentMethod: 'Direct Bank Transfer (NEFT)',
      period: 'Current Settlement',
      api_user: req.apiUser._id,
    });

    return response.created(res, {
      message: 'Payout request submitted successfully',
      settlement: {
        _id: String(settlement._id),
        id: settlement.settlementId,
        date: settlement.createdAt,
        period: settlement.period,
        amount: settlement.netPayout,
        commission: settlement.commissionDeducted,
        requestedAmount: settlement.requestedAmount,
        status: settlement.status,
        method: settlement.paymentMethod,
        bankDetails: settlement.bankDetails,
        notes: settlement.notes,
      },
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const getOperatorReports = async (req, res) => {
  try {
    const filter = await getOperatorFilter(req);
    const operatorRoutes = await BusRoute.find({ ...filter });
    const routeIds = operatorRoutes.map((r) => r.routeId || String(r._id)).filter(Boolean);

    const timeFilter = req.query.time || 'all';
    const now = new Date();
    let startDate;

    if (timeFilter === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (timeFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFilter === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const bookingQuery = {
      api_user: req.apiUser._id,
      $or: [
        { operator: filter.operator },
        { routeId: { $in: routeIds } },
      ],
    };

    if (startDate) {
      bookingQuery.createdAt = { $gte: startDate };
    }

    const bookings = await Booking.find(bookingQuery).sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
    const pendingCount = bookings.filter((b) => b.status === 'pending').length;
    const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

    let grossRevenue = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((acc, b) => acc + (Number(b.amount || b.price) || 0), 0);

    const avgTicketValue = confirmedCount > 0 ? Math.round(grossRevenue / confirmedCount) : 0;
    const cancellationRate = totalBookings > 0 ? Number(((cancelledCount / totalBookings) * 100).toFixed(1)) : 0;

    const routePerformance = operatorRoutes.map((r) => {
      const title = `${r.from || 'Origin'} → ${r.to || 'Destination'}`;
      const routeBookings = bookings.filter((b) => b.routeId === r.routeId || b.routeId === String(r._id));
      const bookingsCount = routeBookings.length;
      
      const activeBookings = routeBookings.filter((b) => b.status !== 'cancelled');
      const rev = activeBookings.reduce((acc, b) => acc + (Number(b.amount || b.price) || 0), 0);
      const occupiedSeats = activeBookings.reduce((acc, b) => acc + Number(b.seats || 1), 0);
      
      const uniqueDates = new Set(activeBookings.map((b) => b.date).filter(Boolean));
      const tripsCount = Math.max(1, uniqueDates.size);
      
      const totalCapacity = (r.totalSeats || r.seats || 40) * tripsCount;
      const occupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((occupiedSeats / totalCapacity) * 100)) : 0;

      return {
        routeId: r.routeId || String(r._id),
        title,
        busType: r.busType || 'AC Sleeper',
        price: r.price || 45,
        totalSeats: r.totalSeats || r.seats || 40,
        bookingsCount,
        revenue: rev,
        occupancyRate,
      };
    });

    return response.ok(res, {
      summary: {
        totalBookings,
        confirmedCount,
        pendingCount,
        cancelledCount,
        grossRevenue,
        avgTicketValue,
        cancellationRate,
      },
      routePerformance,
    });
  } catch (error) {
    return response.error(res, error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  listBusTypes,
  createBusType,
  deleteBusType,
  listBookings,
  updateBookingStatus,
  updateRoutePrice,
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  submitCallback,
  listCallbacks,
  updateCallbackStatus,
  deleteCallback,
  listCities,
  getOperatorRevenue,
  getOperatorReports,
  requestPayout,
};
