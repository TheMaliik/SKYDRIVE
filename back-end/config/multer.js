const multer = require('multer');

const storage = multer.memoryStorage(); // Store file in memory for Cloudinary upload
const upload = multer({ storage });

module.exports = upload;