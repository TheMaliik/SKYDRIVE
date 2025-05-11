const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const upload = require('../config/multer');
const Contract = require('../model/Contrat');
const Location = require('../model/Location');
const { v4: uuidv4 } = require('uuid');

router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { locationId } = req.body;

    // Validate required fields
    if (!locationId || !req.file) {
      return res.status(400).json({ error: 'locationId and PDF file are required' });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    // Validate locationId exists
    const locationExists = await Location.exists({ _id: locationId });
    if (!locationExists) {
      return res.status(400).json({ error: 'Invalid locationId' });
    }

    // Get filename without extension and create unique public_id
    const filename = req.file.originalname.replace(/\.pdf$/i, '');
    const uniqueId = uuidv4();
    const publicId = `contracts/${filename}_${uniqueId}`;

    // Upload PDF to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'contracts',
          public_id: publicId,
          format: 'pdf',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        reject(error);
      });
      stream.end(req.file.buffer);
    });

    // Log Cloudinary result
    console.log('Cloudinary upload result:', result);

    // Validate secure_url
    if (!result.secure_url) {
      throw new Error('Cloudinary did not return a secure URL');
    }

    // Save contract details to MongoDB
    const contract = new Contract({
      locationId,
      pdfUrl: result.secure_url,
      publicId: result.public_id,
      generatedAt: new Date(),
    });

    await contract.save();

    res.status(201).json({
      message: 'Contract uploaded successfully',
      contract,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});










// Fetch all contracts
router.get('/', async (req, res) => {
  try {
    const contracts = await Contract.find().populate('locationId');
    res.status(200).json({
      message: 'Contracts fetched successfully',
      contracts,
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Fetch a single contract by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid contract ID' });
    }

    const contract = await Contract.findById(id).populate('locationId');
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.status(200).json({
      message: 'Contract fetched successfully',
      contract,
    });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});








module.exports = router;