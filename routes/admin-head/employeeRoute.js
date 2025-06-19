const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { registerTutor, registerCounsellor, getAllStaff, updateEmployee } = require('../../controllers/admin-head/employeeController');
const { toggleEmployeeActiveStatus } = require('../../controllers/language/languageController');


const router = express.Router();

// Multer setup: store to ./uploads/ then we push to Cloudinary
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});
const upload = multer({ storage });

// Tutor route: expect profilePicture, cv, validDocs[]
router.post(
  '/tutor/register',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'cv',             maxCount: 1 },
    { name: 'validDocs',      maxCount: 10 }
  ]),
  registerTutor
);

// Counsellor route: expect profilePicture, validDocs[]
router.post(
  '/counsellor/register',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'validDocs',      maxCount: 10 }
  ]),
  registerCounsellor
);

router.get('/staff/all', getAllStaff);

router.put(
  '/employee/:id',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'cv',             maxCount: 1 },
    { name: 'validDocs',      maxCount: 10 }
  ]),
  updateEmployee
);
router.patch('/employee/:id/active', toggleEmployeeActiveStatus);
module.exports = router;
