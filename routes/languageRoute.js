// routes/languages.js

const express = require('express');
const { getAllLanguages, getLanguageById, createLanguage, updateLanguage, deleteLanguage } = require('../controllers/language/languageController');
const router = express.Router();

// Public endpoints (authenticated users)
router.get(
  '/',

  getAllLanguages
);

router.get(
  '/:id',

getLanguageById
);

// Protected endpoints (owner/admin only)
router.post(
  '/',

createLanguage
);

router.put(
  '/:id',

updateLanguage
);

router.delete(
  '/:id',

deleteLanguage
);

module.exports = router;
