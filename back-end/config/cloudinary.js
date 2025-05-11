const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dhd601aps',
  api_key: '118996247442839',
  api_secret: 'sXy__pokJHSixf_SSLfc1W56vlk',
});

module.exports = cloudinary;