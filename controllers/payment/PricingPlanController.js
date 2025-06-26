// src/controllers/pricingPlanController.js
const PricingPlan = require('../../models/billsAndPayment/PricingPlanModel');

// Helper: resolve price and discount based on currency
function resolvePricing(plan, currency) {
  const curr = currency || plan.defaultCurrency;

  // Convert plain object → Map if needed
  const priceMap = plan.prices instanceof Map
    ? plan.prices
    : new Map(Object.entries(plan.prices || {}));
  
  // Grab base price (fallback to defaultCurrency or 0)
  const base = priceMap.get(curr) 
              ?? priceMap.get(plan.defaultCurrency) 
              ?? 0;

  let finalPrice    = base;
  let discountType  = null;
  let discountValue = 0;

  // Normalize discount amounts map
  const amountMap = plan.discount?.amounts instanceof Map
    ? plan.discount.amounts
    : new Map(Object.entries(plan.discount?.amounts || {}));

  if (plan.discount?.type === 'percent') {
    discountType  = 'percent';
    discountValue = Number(plan.discount.percent) || 0;
    finalPrice    = +(base * (1 - discountValue / 100)).toFixed(2);

  } else if (plan.discount?.type === 'amount') {
    discountType  = 'amount';
    discountValue = Number(amountMap.get(curr) || 0);
    finalPrice    = +(base - discountValue).toFixed(2);
  }

  return {
    currency,
    originalPrice: base,
    finalPrice,
    discountType,
    discountValue
  };
}

// Create a new plan
exports.createPlan = async (req, res) => {
  try {
    const plan = new PricingPlan(req.body);
    await plan.save();
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all active plans, resolved by currency
// Get all active plans, resolved by currency
exports.getAllPlans = async (req, res) => {
  try {
    const currency = req.query.currency;
    const plans    = await PricingPlan.find({ isActive: true }).lean();

    // wrap each plan resolution in its own try/catch
    const data = plans.map(plan => {
      try {
        return { ...plan, ...resolvePricing(plan, currency) };
      } catch (err) {
        console.error(`Error pricing plan ${plan._id}:`, err);
        // fallback: return plan with zeroed pricing
        return { ...plan,
                 currency,
                 originalPrice: 0,
                 finalPrice: 0,
                 discountType: null,
                 discountValue: 0 };
      }
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error('🔥 getAllPlans:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


// Get single plan by ID or slug
exports.getPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const currency = req.query.currency;
    const plan = await PricingPlan.findOne({ $or: [{ _id: id }, { slug: id }] }).lean();
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: { ...plan, ...resolvePricing(plan, currency) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Update any field of a plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Soft-delete (deactivate) a plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Toggle active status
exports.togglePlanStatus = async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
