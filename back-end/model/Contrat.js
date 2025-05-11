const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location ID is required'],
      index: true,
    },
    pdfUrl: {
      type: String,
      required: [true, 'PDF URL is required'],
      trim: true,
      validate: {
        validator: (url) => /^(https?:\/\/[^\s$.?#].[^\s]*)$/.test(url),
        message: 'Invalid PDF URL format',
      },
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Contract', contractSchema);