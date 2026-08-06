'use strict';
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    for: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    title: { type: String },
    description: { type: String },
    invited_for: { type: mongoose.Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.set('toJSON', {
  getters: true,
  virtuals: false,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification2', notificationSchema, 'notifications');
