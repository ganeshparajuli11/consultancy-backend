const cloudinary = require('./cloudinary');

const uploadWithCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'langzy/flags'
    });
    return result.secure_url;
  } catch (err) {
    throw new Error("Cloudinary upload failed: " + err.message);
  }
};

module.exports = uploadWithCloudinary;
