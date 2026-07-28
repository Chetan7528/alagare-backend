'use strict';
const OperatorApplication = require('@models/OperatorApplication');
const User = require('@models/User');
const bcrypt = require('bcryptjs');
const response = require('@responses');

const submit = async (req, res) => {
  try {
    const {
      companyName, registrationNo, gst, yearFounded,
      ownerName, email, phone, address, city, state,
      totalBuses, routesCovered, busTypes,
    } = req.body;

    if (!companyName || !registrationNo || !ownerName || !email || !phone) {
      return response.badReq(res, { message: 'companyName, registrationNo, ownerName, email and phone are required' });
    }

    const existing = await OperatorApplication.findOne({
      email: email.toLowerCase().trim(),
      api_user: req.apiUser._id,
      status: { $in: ['pending', 'under_review', 'approved'] },
    });

    if (existing) {
      return response.conflict(res, { message: 'An application with this email already exists' });
    }

    const docs = {};
    if (req.files) {
      const fields = ['registration', 'permit', 'vehicle', 'insurance', 'bank', 'id'];
      fields.forEach((f) => {
        if (req.files[f]?.[0]?.location) docs[f] = req.files[f][0].location;
        else if (req.files[f]?.[0]?.path) docs[f] = req.files[f][0].path;
      });
    }

    const application = await OperatorApplication.create({
      companyName: companyName.trim(),
      registrationNo: registrationNo.trim(),
      gst: gst?.trim() || '',
      yearFounded: yearFounded?.trim() || '',
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address?.trim() || '',
      city: city?.trim() || '',
      state: state?.trim() || '',
      totalBuses: Number(totalBuses) || 0,
      routesCovered: Number(routesCovered) || 0,
      busTypes: Array.isArray(busTypes) ? busTypes : [],
      docs,
      api_user: req.apiUser._id,
    });

    return response.created(res, {
      message: 'Application submitted successfully. Our team will review it within 2-3 business days.',
      applicationId: application._id,
      status: application.status,
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await OperatorApplication.countDocuments(filter);
    const applications = await OperatorApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return response.ok(res, { total, page: Number(page), applications });
  } catch (error) {
    return response.error(res, error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return response.badReq(res, { message: 'Invalid status' });
    }

    const application = await OperatorApplication.findById(id);
    if (!application) return response.notFound(res, { message: 'Application not found' });

    application.status = status;

    if (status === 'approved' && !application.userId) {
      const existingUser = await User.findOne({ email: application.email });

      if (existingUser) {
        existingUser.role = 'operator';
        await existingUser.save();
        application.userId = existingUser._id;
      } else {
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const hashed = await bcrypt.hash(tempPassword, 10);
        const newUser = await User.create({
          fullname: application.ownerName,
          email: application.email,
          password: hashed,
          phone: application.phone,
          role: 'operator',
          isVerified: true,
          api_user: application.api_user,
        });
        application.userId = newUser._id;
        console.log(`[Operator Approved] Login: ${application.email} | Temp Password: ${tempPassword}`);
      }
    }

    await application.save();

    return response.ok(res, {
      message: `Status updated to ${status}${status === 'approved' ? '. Operator account created/updated.' : ''}`,
      application,
    });
  } catch (error) {
    return response.error(res, error);
  }
};

module.exports = { submit, getAll, updateStatus };
