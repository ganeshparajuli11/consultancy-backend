const express = require('express');
const { 
  getContactInfo, 
  submitContactForm, 
  getCompanyInfo,
  createOrUpdateContactInfo,
  getContactFormSubmissions,
  updateContactFormStatus,
  getContactFormById,
  deleteContactFormSubmission
} = require('../../controllers/pages/PagesController');
const authenticateJWT = require('../../middleware/auth/authenticate');
const { checkIsAdmin } = require('../../middleware/auth/role');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pages
 *   description: Page content and form submission endpoints
 */

/**
 * @swagger
 * /api/pages/contact-info:
 *   get:
 *     summary: Get contact information
 *     tags: [Pages]
 *     responses:
 *       200:
 *         description: Contact information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     address:
 *                       type: string
 *                     workingHours:
 *                       type: string
 *                     socialMedia:
 *                       type: object
 */
router.get('/contact-info', getContactInfo);

/**
 * @swagger
 * /api/pages/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Pages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - contactNumber
 *               - subject
 *               - message
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               contactNumber:
 *                 type: string
 *                 description: User's contact number
 *               subject:
 *                 type: string
 *                 description: Subject of the inquiry
 *               message:
 *                 type: string
 *                 description: Detailed message
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/contact', submitContactForm);

/**
 * @swagger
 * /api/pages/company-info:
 *   get:
 *     summary: Get company information
 *     tags: [Pages]
 *     responses:
 *       200:
 *         description: Company information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     founded:
 *                       type: string
 *                     mission:
 *                       type: string
 *                     vision:
 *                       type: string
 *                     values:
 *                       type: array
 *                     stats:
 *                       type: object
 */
router.get('/company-info', getCompanyInfo);

// ===== ADMIN ROUTES =====

/**
 * @swagger
 * /api/pages/admin/contact-info:
 *   post:
 *     summary: Create or update contact information (Admin only)
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - address
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               workingHours:
 *                 type: string
 *               supportEmail:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               socialMedia:
 *                 type: object
 *               companyInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Contact information updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/admin/contact-info', authenticateJWT, checkIsAdmin, createOrUpdateContactInfo);

/**
 * @swagger
 * /api/pages/admin/contact-submissions:
 *   get:
 *     summary: Get all contact form submissions (Admin only)
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, resolved, closed]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *     responses:
 *       200:
 *         description: Contact submissions retrieved successfully
 */
router.get('/admin/contact-submissions', authenticateJWT, checkIsAdmin, getContactFormSubmissions);

/**
 * @swagger
 * /api/pages/admin/contact-submissions/{id}:
 *   get:
 *     summary: Get contact form submission by ID (Admin only)
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact submission retrieved successfully
 *       404:
 *         description: Submission not found
 */
router.get('/admin/contact-submissions/:id', authenticateJWT, checkIsAdmin, getContactFormById);

/**
 * @swagger
 * /api/pages/admin/contact-submissions/{id}:
 *   put:
 *     summary: Update contact form submission status (Admin only)
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, resolved, closed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               assignedTo:
 *                 type: string
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *       404:
 *         description: Submission not found
 */
router.put('/admin/contact-submissions/:id', authenticateJWT, checkIsAdmin, updateContactFormStatus);

/**
 * @swagger
 * /api/pages/admin/contact-submissions/{id}:
 *   delete:
 *     summary: Delete contact form submission (Admin only)
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *       404:
 *         description: Submission not found
 */
router.delete('/admin/contact-submissions/:id', authenticateJWT, checkIsAdmin, deleteContactFormSubmission);

module.exports = router; 