const uploadWithCloudinary = require('./cloudinaryUploader');
const uploadWithS3 = require('./s3Uploader');

exports.uploadFile = async (file) => {
  if (process.env.STORAGE_PROVIDER === 'cloudinary') {
    return await uploadWithCloudinary(file);
  } else {
    return await uploadWithS3(file);
  }
};
