const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require('multer');
const bcrypt = require('bcrypt');
const User = require("../model/User"); // Adjust path to your User model
const path = require('path');
const mongoose = require('mongoose'); // Add mongoose import
require("dotenv").config();
const cloudinary = require('../config/cloudinary'); // Assuming your cloudinary config path
const { CloudinaryStorage } = require('multer-storage-cloudinary');





const cors = require('cors');





router.get('/user/findByEmail/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});










// Configure CORS
router.use(cors({
  origin: 'http://localhost:3000', // Adjust to your frontend URL (e.g., http://localhost:5173 for Vite)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Configure multer for file uploads
// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_photos', // Cloudinary folder name
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }], // Optional: resize images
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  },
});

// Update profile information with photo
router.put('/edit/:id', upload.single('photo'), async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const { nom, prenom, email, phone, address, ville, cin } = req.body;

    if (!nom || !prenom || !email || !cin) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const emailExists = await User.findOne({ email, _id: { $ne: userId } });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Update user fields
    user.nom = nom;
    user.prenom = prenom;
    user.email = email;
    user.phone = phone || '';
    user.address = address || '';
    user.ville = ville || '';
    user.cin = cin;

    // Handle photo upload
    if (req.file) {
      // Delete old photo from Cloudinary if it exists
      if (user.photo) {
        const publicId = user.photo.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`user_photos/${publicId}`);
      }
      // Store new photo URL
      user.photo = req.file.path; // Cloudinary URL
    }

    await user.save();

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        phone: user.phone,
        address: user.address,
        ville: user.ville,
        cin: user.cin,
        photo: user.photo
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});




router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate input
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user by ID
    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (the pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});





module.exports = router;