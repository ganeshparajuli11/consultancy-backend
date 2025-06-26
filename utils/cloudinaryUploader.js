// utils/cloudinaryUploader.js
const cloudinary = require('./cloudinary');

const uploadWithCloudinary = async (fileInput, folder = 'langzy/flags') => {
  const filePath = typeof fileInput === 'string'
    ? fileInput
    : fileInput?.path;

  if (!filePath) {
    throw new Error('No file path provided for Cloudinary upload');
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto'
  });
  return result.secure_url;
};

module.exports = uploadWithCloudinary;
