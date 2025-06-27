const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getAllLanguages,
  getLanguageById,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  toggleLanguageActiveStatus,
  bulkToggleLanguageActiveStatus,
  getLanguagesWithLevels,
  searchLanguages,
  sortLanguages,
  removeLevelFromLanguage,
  exportLanguagesToCSV
} = require('../controllers/language/languageController');
const { cloneLanguage, getLanguageSummary } = require('../controllers/admin-head/employeeController');
const authenticateJWT = require('../middleware/auth/authenticate');
const { checkIsAdmin } = require('../middleware/auth/role');

const router = express.Router();

// Configure multer (stores in temp folder "uploads/")
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-flag${ext}`);
  }
});
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Languages
 *   description: Language management endpoints
 */

/**
 * @swagger
 * /api/languages:
 *   get:
 *     summary: Get all languages
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of languages
 */
router.get('/', getAllLanguages);

/**
 * @swagger
 * /api/languages/{id}:
 *   get:
 *     summary: Get a language by ID
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Language found
 */
router.get('/:id', authenticateJWT, checkIsAdmin, getLanguageById);

/**
 * @swagger
 * /api/languages:
 *   post:
 *     summary: Create a new language
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               flag:
 *                 type: string
 *                 format: binary
 *               flag_type:
 *                 type: string
 *               description:
 *                 type: string
 *               direction:
 *                 type: string
 *               levels:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Language created
 */
router.post('/', upload.single('flag'), authenticateJWT, checkIsAdmin, createLanguage);

/**
 * @swagger
 * /api/languages/{id}:
 *   put:
 *     summary: Update a language
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               flag:
 *                 type: string
 *                 format: binary
 *               flag_type:
 *                 type: string
 *               description:
 *                 type: string
 *               direction:
 *                 type: string
 *               levels:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Language updated
 */
router.put('/:id', upload.single('flag'), authenticateJWT, checkIsAdmin, updateLanguage);

/**
 * @swagger
 * /api/languages/{id}:
 *   delete:
 *     summary: Soft delete a language
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Language soft deleted
 */
router.delete('/:id', authenticateJWT, checkIsAdmin, deleteLanguage);

/**
 * @swagger
 * /api/languages/{id}/active:
 *   patch:
 *     summary: Toggle a language's active status
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Language active status updated
 */
router.patch('/:id/active', authenticateJWT, checkIsAdmin, toggleLanguageActiveStatus);

/**
 * @swagger
 * /api/languages/bulk-toggle:
 *   patch:
 *     summary: Bulk toggle multiple languages' active status
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bulk toggle successful
 */
router.patch('/bulk-toggle', authenticateJWT, checkIsAdmin, bulkToggleLanguageActiveStatus);

/**
 * @swagger
 * /api/languages/{id}/clone:
 *   post:
 *     summary: Clone a language
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Language cloned successfully
 */
router.post('/:id/clone', authenticateJWT, checkIsAdmin, cloneLanguage);

/**
 * @swagger
 * /api/languages/{id}/summary:
 *   get:
 *     summary: Get a language summary
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Language summary retrieved
 */
router.get('/:id/summary', authenticateJWT, checkIsAdmin, getLanguageSummary);

/**
 * @swagger
 * /api/languages/with-levels:
 *   get:
 *     summary: Get all languages with their associated levels
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns languages with populated levels
 */
router.get('/with-levels', authenticateJWT, checkIsAdmin, getLanguagesWithLevels);

/**
 * @swagger
 * /api/languages/search:
 *   get:
 *     summary: Search for languages by query
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search keyword for name/code/description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Filtered list of languages
 */
router.get('/search', authenticateJWT, checkIsAdmin, searchLanguages);


/**
 * @swagger
 * /api/languages/sort:
 *   get:
 *     summary: Sort languages by field (e.g., name, createdAt)
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (default: name)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Sorted list of languages
 */

router.get('/sort', authenticateJWT, checkIsAdmin, sortLanguages);

/**
 * @swagger
 * /api/languages/{languageId}/levels/{levelId}:
 *   delete:
 *     summary: Remove a level from a language
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: languageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Language ID
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Level ID to remove
 *     responses:
 *       200:
 *         description: Level removed successfully
 */
router.delete('/:languageId/levels/:levelId', authenticateJWT, checkIsAdmin, removeLevelFromLanguage);

/**
 * @swagger
 * /api/languages/export/csv:
 *   get:
 *     summary: Export all language data to CSV
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/csv',  exportLanguagesToCSV);
module.exports = router;
