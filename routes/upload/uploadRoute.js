const express = require('express');
const multer = require('multer');
const uploadWithCloudinary = require('../../utils/cloudinaryUploader');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types for forms
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }
});

/**
 * Upload single file to Cloudinary
 * POST /api/upload/file
 */
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file provided', 400);
    }

    const { folder = 'langzy/forms' } = req.body;

    console.log('File upload request:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      folder: folder
    });

    // Create a temporary file for Cloudinary upload
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const tempFileName = `${Date.now()}-${req.file.originalname}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadWithCloudinary(tempFilePath, folder);
      
      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      const responseData = {
        url: cloudinaryUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        folder: folder,
        uploadedAt: new Date()
      };

      console.log('File uploaded successfully:', responseData);

      return successResponse(res, 'File uploaded successfully', responseData);

    } catch (cloudinaryError) {
      // Clean up temporary file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw cloudinaryError;
    }

  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File size too large. Maximum size is 50MB', 400);
    }
    
    if (error.message.includes('File type')) {
      return errorResponse(res, error.message, 400);
    }

    return errorResponse(res, 'Failed to upload file', 500);
  }
});

/**
 * Upload multiple files to Cloudinary
 * POST /api/upload/files
 */
router.post('/files', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'No files provided', 400);
    }

    const { folder = 'langzy/forms' } = req.body;

    console.log('Multiple file upload request:', {
      fileCount: req.files.length,
      folder: folder
    });

    const uploadPromises = req.files.map(async (file) => {
      // Create temporary file for each upload
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const tempDir = os.tmpdir();
      const tempFileName = `${Date.now()}-${Math.random()}-${file.originalname}`;
      const tempFilePath = path.join(tempDir, tempFileName);
      
      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, file.buffer);

      try {
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadWithCloudinary(tempFilePath, folder);
        
        // Clean up temporary file
        fs.unlinkSync(tempFilePath);

        return {
          url: cloudinaryUrl,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          folder: folder,
          uploadedAt: new Date()
        };

      } catch (cloudinaryError) {
        // Clean up temporary file on error
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw new Error(`Failed to upload ${file.originalname}: ${cloudinaryError.message}`);
      }
    });

    const uploadResults = await Promise.all(uploadPromises);

    console.log('Multiple files uploaded successfully:', uploadResults.length);

    return successResponse(res, 'Files uploaded successfully', {
      files: uploadResults,
      count: uploadResults.length
    });

  } catch (error) {
    console.error('Multiple file upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'One or more files are too large. Maximum size is 50MB per file', 400);
    }

    return errorResponse(res, error.message || 'Failed to upload files', 500);
  }
});

/**
 * Delete file from Cloudinary
 * DELETE /api/upload/file
 */
router.delete('/file', async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return errorResponse(res, 'Public ID is required', 400);
    }

    const cloudinary = require('../../utils/cloudinary');
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      return successResponse(res, 'File deleted successfully');
    } else {
      return errorResponse(res, 'Failed to delete file', 400);
    }

  } catch (error) {
    console.error('File deletion error:', error);
    return errorResponse(res, 'Failed to delete file', 500);
  }
});

module.exports = router; 