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

// Public endpoints (for authenticated users)
router.get('/',authenticateJWT,checkIsAdmin, getAllLanguages);
router.get('/:id',authenticateJWT,checkIsAdmin, getLanguageById);

// Protected endpoints (e.g., Admin/Owner)
router.post('/', upload.single('flag'),authenticateJWT,checkIsAdmin, createLanguage);
router.put('/:id', upload.single('flag'),authenticateJWT,checkIsAdmin, updateLanguage);
router.delete('/:id',authenticateJWT,checkIsAdmin, deleteLanguage);

module.exports = router;
