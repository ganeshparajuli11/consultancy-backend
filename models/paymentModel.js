// models/Payment.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Schema: PaymentTransaction
 * Records individual payment transactions made by users via Stripe or Khalti.
 */
const PaymentTransactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pricing: {
    type: Schema.Types.ObjectId,
    ref: 'Pricing'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['USD', 'NPR'],
    default: 'USD'
  },
  method: {
    type: String,
    enum: ['stripe', 'khalti'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
PaymentTransactionSchema.index({ status: 1, createdAt: 1 });
PaymentTransactionSchema.index({ user: 1, status: 1, createdAt: 1 });

/**
 * Schema: BillingInfo
 * Stores aggregate billing information for each user, across multiple currencies.
 */
const BillingInfoSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalPaid: {
    type: Map,
    of: Number,
    default: {}
  },
  totalDue: {
    type: Map,
    of: Number,
    default: {}
  },
  totalRemaining: {
    type: Map,
    of: Number,
    default: {}
  },
  lastPaymentAt: {
    type: Date
  },
  nextPaymentDue: {
    type: Date
  },
  defaultMethod: {
    type: String,
    enum: ['stripe', 'khalti'],
    default: 'stripe'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time'],
    default: 'monthly'
  }
}, {
  timestamps: true
});

BillingInfoSchema.index({ user: 1 });

/**
 * Schema: Pricing
 * Defines pricing for each language-level combination or custom plan.
 */
const PricingSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: Schema.Types.ObjectId,
    ref: 'Language',
    required: true
  },
  level: {
    type: Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['USD', 'NPR'],
    default: 'USD'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

PricingSchema.index({ language: 1, level: 1, billingCycle: 1 }, { unique: true });

/**
 * Schema: FinanceSummary
 * Pre-aggregated global metrics for high-frequency dashboard queries.
 */
const FinanceSummarySchema = new Schema({
  totalReceived: {
    type: Number,
    default: 0
  },
  totalPending: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const FinanceSummary = mongoose.model('FinanceSummary', FinanceSummarySchema);

// Middleware: update aggregates after each transaction save
PaymentTransactionSchema.post('save', async function(doc) {
  try {
    // Update per-user billing info
    if (doc.status === 'completed') {
      await mongoose.model('BillingInfo').findOneAndUpdate(
        { user: doc.user },
        {
          $inc: {
            [`totalPaid.${doc.currency}`]: doc.amount,
            [`totalRemaining.${doc.currency}`]: -doc.amount
          },
          $set: { lastPaymentAt: doc.createdAt }
        },
        { upsert: true }
      );
      // Update global summary
      await FinanceSummary.findOneAndUpdate(
        {},
        { $inc: { totalReceived: doc.amount }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
    } else if (doc.status === 'pending') {
      await FinanceSummary.findOneAndUpdate(
        {},
        { $inc: { totalPending: doc.amount }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('Error updating billing or summary:', err);
  }
});

// Model exports
const PaymentTransaction = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
const BillingInfo = mongoose.model('BillingInfo', BillingInfoSchema);
const Pricing = mongoose.model('Pricing', PricingSchema);

module.exports = {
  PaymentTransaction,
  BillingInfo,
  Pricing,
  FinanceSummary
};
