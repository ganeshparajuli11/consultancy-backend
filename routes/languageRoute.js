const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getAllLanguages,
  getLanguageById,
  createLanguage,
  updateLanguage,
  deleteLanguage
} = require('../controllers/language/languageController');

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

// Public endpoints (for authenticated users)
router.get('/', getAllLanguages);
router.get('/:id', getLanguageById);

// Protected endpoints (e.g., Admin/Owner)
router.post('/', upload.single('flag'), createLanguage);
router.put('/:id', upload.single('flag'), updateLanguage);
router.delete('/:id', deleteLanguage);

module.exports = router;
