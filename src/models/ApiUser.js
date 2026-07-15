'use strict';
const mongoose = require('mongoose');
const crypto = require('crypto');

const apiUserSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
        'Please enter a valid email address',
      ],
    },
    api_key: {
      type: String,
      unique: true,
    },
    /** Public app setup name — mobile fetches key via GET /setup/:appName */
    app_name: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    /** Frontend keys delivered on login (Google Maps, etc.) — per tenant */
    client_keys: {
      googleMaps: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  { timestamps: true },
);

apiUserSchema.methods.generateApiKey = function () {
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(this._id.toString())
    .digest('hex');
  return `${this._id}.${signature}`;
};

module.exports = mongoose.model('ApiUser', apiUserSchema);
