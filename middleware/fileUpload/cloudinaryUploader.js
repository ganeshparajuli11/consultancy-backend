const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'consultancy_uploads',
    allowed_formats: ['jpg', 'png', 'pdf', 'ppt', 'pptx', 'mp4', 'mov'],
    resource_type: 'auto', // handles images, videos, documents
  },
});

const upload = multer({ storage });

module.exports = upload;
