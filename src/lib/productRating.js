'use strict';
const mongoose = require('mongoose');
const Review = require('@models/Review');
const Product = require('@models/Product');

async function updateProductRating(productId) {
  if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
    return { avgRating: 0, reviewCount: 0 };
  }

  const pid = new mongoose.Types.ObjectId(String(productId));
  const stats = await Review.aggregate([
    { $match: { product: pid, status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;
  const avgRating = Math.round(avg * 10) / 10;

  await Product.findByIdAndUpdate(pid, {
    avgRating,
    reviewCount: count,
  });

  return { avgRating, reviewCount: count };
}

module.exports = { updateProductRating };
