const express = require('express');
const router = express.Router();
const contentController = require('../../controllers/content/contentController');
const authenticateJWT = require('../../middleware/auth/authenticate');
const { checkIsAdmin, checkIsTutor } = require('../../middleware/auth/role');

// Question Routes
router.post('/questions', authenticateJWT, checkIsAdmin,checkIsTutor, contentController.createQuestion);
router.get('/questions', authenticateJWT, contentController.getQuestions);
router.put('/questions/:id', authenticateJWT, checkIsAdmin, contentController.updateQuestion);
router.delete('/questions/:id', authenticateJWT, checkIsAdmin, contentController.deleteQuestion);
router.post('/questions/bulk',authenticateJWT, checkIsAdmin, contentController.bulkCreateQuestions);

// Assessment Routes
router.post('/assessments', authenticateJWT, checkIsAdmin, contentController.createAssessment);
router.get('/assessments', authenticateJWT, contentController.getAssessments);
router.put('/assessments/:id', authenticateJWT, checkIsAdmin, contentController.updateAssessment);
router.delete('/assessments/:id', authenticateJWT, checkIsAdmin, contentController.deleteAssessment);

// Lesson Routes
router.post('/lessons', authenticateJWT, checkIsAdmin, contentController.createLesson);
router.get('/lessons', authenticateJWT, contentController.getLessons);
router.put('/lessons/:id', authenticateJWT, checkIsAdmin, contentController.updateLesson);
router.delete('/lessons/:id', authenticateJWT, checkIsAdmin, contentController.deleteLesson);

// Module Routes
router.post('/modules', authenticateJWT, checkIsAdmin, contentController.createModule);
router.get('/modules', authenticateJWT, contentController.getModules);
router.put('/modules/:id', authenticateJWT, checkIsAdmin, contentController.updateModule);
router.delete('/modules/:id', authenticateJWT, checkIsAdmin, contentController.deleteModule);

// Content Routes
router.post('/content', authenticateJWT, checkIsAdmin, contentController.createContent);
router.get('/content', authenticateJWT, contentController.getContents);
router.get('/content/:id', authenticateJWT, contentController.getContentById);
router.put('/content/:id', authenticateJWT, checkIsAdmin, contentController.updateContent);
router.delete('/content/:id', authenticateJWT, checkIsAdmin, contentController.deleteContent);

// Stats Routes
router.get('/stats', authenticateJWT, checkIsAdmin,checkIsTutor, contentController.getContentStats);

module.exports = router; 