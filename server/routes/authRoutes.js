import express from "express";
import {
  registerUser as register,
  loginUser as login,
  getCurrentUser as getUserProfile,
  updateProfile as updateUserProfile,
  changePassword,
  logoutUser
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from '../utils/fileUpload.js';
import fs from 'fs';
import User from '../models/User.js';
import path from 'path';
import cloudinary, { uploadFile } from '../utils/cloudinary.js';

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logoutUser); // Add logout route

// Protected routes
router.get("/me", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/password", protect, changePassword);

// Avatar upload route - Using Cloudinary
router.post('/upload-avatar', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    
    // Upload to Cloudinary
    const result = await uploadFile(req.file.path, {
      folder: 'avatars',
      public_id: `avatar-${req.user._id}`,
      overwrite: true
    });
    
    if (!result.success) {
      return res.status(500).json({ message: 'Error uploading to Cloudinary', error: result.error });
    }
    
    // Update user profile image in database with the Cloudinary URL
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: result.url },
      { new: true }
    ).select('-password');
    
    // Remove local file after Cloudinary upload
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove avatar route
router.delete('/remove-avatar', protect, async (req, res) => {
  try {
    // Get user with profile image
    const user = await User.findById(req.user._id);
    
    // If user has a profile image on Cloudinary
    if (user.profileImage && user.profileImage.includes('cloudinary.com')) {
      // Extract public_id from the URL
      const publicId = user.profileImage.split('/').pop().split('.')[0];
      
      try {
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(`avatars/${publicId}`);
      } catch (err) {
        console.error('Error deleting avatar from Cloudinary:', err);
      }
    }
    
    // Update user to remove profile image reference
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: '' },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
