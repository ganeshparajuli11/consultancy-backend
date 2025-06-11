const express = require('express');
const { createSection, getAllSections, getSectionById, updateSection, deleteSection } = require('../controllers/section/sectionController');
const router = express.Router();


router.post('/', createSection);
router.get('/',getAllSections);
router.get('/:id', getSectionById);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

module.exports = router;
