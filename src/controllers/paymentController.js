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

module.exports = {
  createPaymentIntent,
  verifyPayment,
};
