// src/models/PricingPlan.js
const mongoose = require('mongoose');

// Sub-schema for discounts: supports percent or flat amounts per currency
const DiscountSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['percent', 'amount'],
    default: null
  },
  // percent-based discount value
  percent: {
    type: Number,
    default: 0
  },
  // flat-amount discounts keyed by currency code, e.g. { NPR: 100, USD: 2 }
  amounts: {
    type: Map,
    of: Number,
    default: {}
  }
}, { _id: false });

// Main schema for pricing plans
const PricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },

  // Currency & pricing map: { NPR: 1500, USD: 12.5, ... }
  defaultCurrency: { type: String, default: 'NPR' },
  prices: {
    type: Map,
    of: Number,
    required: true
  },

  // Embedded discount structure
  discount: {
    type: DiscountSchema,
    default: () => ({})
  },

  // Billing interval
  billingCycle: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
    default: 'month'
  },

  // Features list
  features: [{ type: String }],

  // UI flags and status
  popular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Optional promotion window
  startsAt: { type: Date },
  endsAt: { type: Date },

  // Free-form metadata for future extension
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

// Index slug for quick queries
PricingPlanSchema.index({ slug: 1 });

module.exports = mongoose.model('PricingPlan', PricingPlanSchema);
