'use strict';
const Inquiry = require('@models/Inquiry');
const response = require('@responses');
const notificationService = require('@services/notification');

const tenantFilter = (req) => ({ api_user: req.apiUser._id });

const CATEGORY_LABELS = {
  booking: 'Booking related',
  cancellation_refund: 'Cancellation / Refund',
  payment: 'Payment issue',
  bus_operator: 'Bus / Operator issue',
  boarding_seat: 'Boarding / Seat',
  other: 'Other',
};

const toPublic = (doc) => ({
  id: String(doc._id),
  fullname: doc.fullname,
  email: doc.email,
  phone: doc.phone || '',
  bookingId: doc.bookingId || '',
  category: doc.category,
  categoryLabel: CATEGORY_LABELS[doc.category] || doc.category,
  subject: doc.subject,
  message: doc.message,
  status: doc.status,
  adminNote: doc.adminNote || '',
  adminReply: doc.adminReply || '',
  resolvedAt: doc.resolvedAt || null,
  repliedAt: doc.repliedAt || null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

module.exports = {
  CATEGORY_LABELS,

  createInquiry: async (req, res) => {
    try {
      const { fullname, email, phone, bookingId, category, subject, message } =
        req.body;

      if (!fullname?.trim() || !email?.trim() || !category || !subject?.trim() || !message?.trim()) {
        return response.badReq(res, {
          message: 'fullname, email, category, subject and message are required',
        });
      }

      const allowed = Object.keys(CATEGORY_LABELS);
      if (!allowed.includes(category)) {
        return response.badReq(res, { message: 'Invalid inquiry category' });
      }

      const inquiry = await Inquiry.create({
        fullname: String(fullname).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : '',
        bookingId: bookingId ? String(bookingId).trim() : '',
        category,
        subject: String(subject).trim(),
        message: String(message).trim(),
        user: req.user?._id,
        api_user: req.apiUser._id,
      });

      return response.created(res, {
        message: 'Inquiry submitted successfully',
        inquiry: toPublic(inquiry),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  listMyInquiries: async (req, res) => {
    try {
      const userEmail = req.user?.email ? String(req.user.email).trim().toLowerCase() : '';
      const userConditions = [{ user: req.user._id }];
      if (userEmail) {
        userConditions.push({ email: userEmail });
      }

      const items = await Inquiry.find({
        ...tenantFilter(req),
        $or: userConditions,
      })
        .sort({ createdAt: -1 })
        .limit(50);
      return response.ok(res, { inquiries: items.map(toPublic) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  listInquiries: async (req, res) => {
    try {
      const { status, q } = req.query;
      const filter = { ...tenantFilter(req) };
      if (status && status !== 'all') filter.status = status;
      if (q?.trim()) {
        const rx = new RegExp(String(q).trim(), 'i');
        filter.$or = [
          { fullname: rx },
          { email: rx },
          { phone: rx },
          { bookingId: rx },
          { subject: rx },
        ];
      }

      const items = await Inquiry.find(filter).sort({ createdAt: -1 }).limit(200);
      return response.ok(res, { inquiries: items.map(toPublic) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateInquiry: async (req, res) => {
    try {
      const { status, adminNote, adminReply, reply } = req.body;
      const finalReply = adminReply !== undefined ? adminReply : reply;

      const inquiry = await Inquiry.findOne({ _id: req.params.id, ...tenantFilter(req) });
      if (!inquiry) {
        return response.notFound(res, { message: 'Inquiry not found' });
      }

      const update = {};
      if (status !== undefined) {
        const allowed = ['open', 'in_progress', 'resolved', 'closed'];
        if (!allowed.includes(status)) {
          return response.badReq(res, { message: 'Invalid status' });
        }
        update.status = status;
        if (status === 'resolved' && inquiry.status !== 'resolved') {
          update.resolvedAt = new Date();
        }
      }
      if (adminNote !== undefined) update.adminNote = String(adminNote).trim();
      if (finalReply !== undefined) {
        update.adminReply = String(finalReply).trim();
        update.repliedAt = new Date();
      }

      const updated = await Inquiry.findByIdAndUpdate(
        inquiry._id,
        update,
        { new: true },
      );

      if (updated.user) {
        try {
          if (finalReply && String(finalReply).trim()) {
            await notificationService.notify(
              updated.user,
              `Support Reply: ${updated.subject}`,
              `Admin response: ${String(finalReply).trim()}`
            );
          } else if (status === 'resolved' && inquiry.status !== 'resolved') {
            await notificationService.notify(
              updated.user,
              'Support Issue Resolved',
              `Your inquiry regarding "${updated.subject}" has been marked as resolved.`
            );
          }
        } catch (notifErr) {
          console.error('Failed to notify user for inquiry update:', notifErr);
        }
      }

      return response.ok(res, {
        message: 'Inquiry updated successfully',
        inquiry: toPublic(updated),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
