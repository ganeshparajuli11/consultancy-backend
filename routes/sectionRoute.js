const express = require('express');
const {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  toggleSectionActiveStatus,
  enrollStudentInSection,
  removeStudentFromSection,
  transferStudentsBetweenSections,
  getSectionStudents,
  getSectionSummary,
  archiveSection
} = require('../controllers/section/sectionController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Section
 *   description: Section management endpoints
 */

/**
 * @swagger
 * /api/section:
 *   get:
 *     summary: Get all sections
 *     tags: [Section]
 *     responses:
 *       200:
 *         description: List of all sections
 */
router.get('/', getAllSections);

/**
 * @swagger
 * /api/section:
 *   post:
 *     summary: Create a new section
 *     tags: [Section]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - language
 *               - level
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: "IELTS Morning Batch"
 *               code:
 *                 type: string
 *                 example: "IELTS-M1"
 *               description:
 *                 type: string
 *                 example: "This is the main batch for IELTS A1 students"
 *               language:
 *                 type: string
 *                 example: "665f7cc8c4a6f2ec0d8ba152"
 *               level:
 *                 type: string
 *                 example: "665f7ceac4a6f2ec0d8ba153"
 *               tutor:
 *                 type: string
 *                 example: "665f7cc8c4a6f2ec0d8ba154"
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                     startTime:
 *                       type: string
 *                       example: "10:00"
 *                     endTime:
 *                       type: string
 *                       example: "11:30"
 *               capacity:
 *                 type: number
 *                 example: 30
 *     responses:
 *       201:
 *         description: Section created successfully
 *       500:
 *         description: Server error
 */
router.post('/', createSection);


/**
 * @swagger
 * /api/section/{id}:
 *   get:
 *     summary: Get a section by ID
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section data
 */
router.get('/:id', getSectionById);

/**
 * @swagger
 * /api/section/{id}:
 *   put:
 *     summary: Update section details
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Section updated
 */
router.put('/:id', updateSection);

/**
 * @swagger
 * /api/section/{id}:
 *   delete:
 *     summary: Delete a section
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Section deleted
 */
router.delete('/:id', deleteSection);

/**
 * @swagger
 * /api/section/section/{id}/active:
 *   patch:
 *     summary: Toggle section active status
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/section/:id/active', toggleSectionActiveStatus);

/**
 * @swagger
 * /api/section/{id}/enroll:
 *   patch:
 *     summary: Enroll a student into a section
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student enrolled
 */
router.patch('/:id/enroll', enrollStudentInSection);

/**
 * @swagger
 * /api/section/{id}/remove-student:
 *   patch:
 *     summary: Remove a student from a section
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student removed
 */
router.patch('/:id/remove-student', removeStudentFromSection);

/**
 * @swagger
 * /api/section/transfer-students:
 *   post:
 *     summary: Transfer students between sections
 *     tags: [Section]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromSectionId:
 *                 type: string
 *               toSectionId:
 *                 type: string
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               transferAll:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Students transferred
 */
router.post('/transfer-students', transferStudentsBetweenSections);

/**
 * @swagger
 * /api/section/{id}/students:
 *   get:
 *     summary: Get all students in a section
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/:id/students', getSectionStudents);

/**
 * @swagger
 * /api/section/{id}/summary:
 *   get:
 *     summary: Get section summary
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Section summary
 */
router.get('/:id/summary', getSectionSummary);

/**
 * @swagger
 * /api/section/{id}/archive:
 *   patch:
 *     summary: Archive (soft delete) a section
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Section archived
 */
router.patch('/:id/archive', archiveSection);

module.exports = router;
