'use strict';
const response = require('@responses');
const Stripe = require('stripe');

const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
};

const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripeInstance();
    if (!stripe) {
      return response.badReq(res, { message: 'Stripe is not configured on server' });
    }

    const { amount, currency = 'eur', bookingDetails = {} } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return response.badReq(res, { message: 'Valid amount is required' });
    }

    if (bookingDetails.routeId && bookingDetails.date) {
      const BusRoute = require('@models/BusRoute');
      const route = await BusRoute.findOne({ routeId: bookingDetails.routeId, status: 'active' });
      if (route) {
        const { isTripDeparted } = require('./busController');
        if (typeof isTripDeparted === 'function' && isTripDeparted(bookingDetails.date, route.departure, 0)) {
          return response.badReq(res, {
            message: 'This bus has already departed. Cannot initiate payment for past trips.',
          });
        }
      }
    }

    const amountInSmallestUnit = Math.round(numAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      metadata: {
        userId: req.user?._id?.toString() || 'guest',
        routeId: bookingDetails.routeId || '',
        passengerName: bookingDetails.passengerName || '',
        contactEmail: bookingDetails.contactEmail || req.user?.email || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return response.ok(res, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      amount: numAmount,
      currency: currency.toLowerCase(),
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const stripe = getStripeInstance();
    if (!stripe) {
      return response.badReq(res, { message: 'Stripe is not configured on server' });
    }

    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return response.badReq(res, { message: 'paymentIntentId is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return response.ok(res, {
      status: paymentIntent.status,
      isPaid: paymentIntent.status === 'succeeded',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    return response.error(res, error);
  }
};

const sycapayService = require('@services/sycapayService');

const sycapayCheckout = async (req, res) => {
  try {
    const { operator, phone, otp, amount, currency = 'XOF', bookingDetails = {} } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return response.badReq(res, { message: 'Valid amount is required' });
    }

    if (!phone) {
      return response.badReq(res, { message: 'Phone number is required' });
    }

    if (bookingDetails.routeId && bookingDetails.date) {
      const BusRoute = require('@models/BusRoute');
      const route = await BusRoute.findOne({ routeId: bookingDetails.routeId, status: 'active' });
      if (route) {
        const { isTripDeparted } = require('./busController');
        if (typeof isTripDeparted === 'function' && isTripDeparted(bookingDetails.date, route.departure, 0)) {
          return response.badReq(res, {
            message: 'This bus has already departed. Cannot initiate payment for past trips.',
          });
        }
      }
    }

    const orderId = `CMD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const passengerName = bookingDetails.passengerName || req.user?.fullname || 'Customer';
    const nameParts = passengerName.trim().split(' ');
    const name = nameParts[0] || 'Customer';
    const pname = nameParts.slice(1).join(' ') || name;

    const result = await sycapayService.checkout({
      operator,
      phone,
      otp,
      amount: numAmount,
      currency,
      orderId,
      name,
      pname,
      urlnotif: '',
    });

    if (result && result.code === 0) {
      return response.ok(res, {
        success: true,
        transactionId: result.transactionId,
        paiementId: result.paiementId,
        orderId: result.orderId || orderId,
        amount: result.amount || numAmount,
        operator: result.operator,
        url: result.url || null,
        img: result.img || null,
        message: result.message,
      });
    }

    return response.badReq(res, {
      message: result?.message || result?.description || 'Payment failed',
      code: result?.code,
    });
  } catch (error) {
    return response.badReq(res, {
      message: error.message || 'Payment initiation failed',
      code: error.code,
    });
  }
};

const sycapayStatus = async (req, res) => {
  try {
    const ref = req.body.ref || req.body.transactionId || req.query.ref;
    if (!ref) {
      return response.badReq(res, { message: 'Transaction reference is required' });
    }
    const data = await sycapayService.getStatus(ref);
    return response.ok(res, data);
  } catch (error) {
    return response.badReq(res, { message: error.message || 'Failed to get payment status' });
  }
};

const sycapayWebhook = async (req, res) => {
  try {
    return response.ok(res, { received: true });
  } catch (error) {
    return response.error(res, error);
  }
};

module.exports = {
  createPaymentIntent,
  verifyPayment,
  sycapayCheckout,
  sycapayStatus,
  sycapayWebhook,
};
