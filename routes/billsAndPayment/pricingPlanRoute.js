// =====================================
// src/routes/pricingPlanRoutes.js
// =====================================
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/payment/PricingPlanController');

/**
 * @swagger
 * tags:
 *   - name: Pricing Plans
 *     description: Manage subscription and pricing plans
 */

/**
 * @swagger
 * /api/plans:
 *   post:
 *     summary: Create a new pricing plan
 *     tags: [Pricing Plans]
 */
router.post('/', ctrl.createPlan);

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Retrieve all active pricing plans
 *     tags: [Pricing Plans]
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Currency code (e.g. NPR, USD)
 */
router.get('/plans', ctrl.getAllPlans);

/**
 * @swagger
 * /api/plans/{id}:
 *   get:
 *     summary: Get a single plan by ID or slug
 *     tags: [Pricing Plans]
 */
router.get('/:id', ctrl.getPlan);

/**
 * @swagger
 * /api/plans/{id}:
 *   put:
 *     summary: Update an existing plan
 *     tags: [Pricing Plans]
 */
router.put('/:id', ctrl.updatePlan);

/**
 * @swagger
 * /api/plans/{id}:
 *   delete:
 *     summary: Deactivate a plan
 *     tags: [Pricing Plans]
 */
router.delete('/:id', ctrl.deletePlan);

/**
 * @swagger
 * /api/plans/{id}/status:
 *   patch:
 *     summary: Toggle a plan's active status
 *     tags: [Pricing Plans]
 */
router.patch('/:id/status', ctrl.togglePlanStatus);

module.exports = router;