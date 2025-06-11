require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

(async () => {
  try {
    const result = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
      { public_id: 'test-shoes' }
    );
    console.log("Uploaded:", result);

    const optimizedUrl = cloudinary.url('test-shoes', {
      fetch_format: 'auto',
      quality: 'auto'
    });
    console.log("Optimized URL:", optimizedUrl);
  } catch (err) {
    console.error("Upload failed:", err);
  }
})();
