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
import { promisify } from 'util';
import User from '../models/User.js';
import path from 'path';

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logoutUser); // Add logout route

// Protected routes
router.get("/me", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/password", protect, changePassword);

// Avatar upload route - Using local storage
router.post('/upload-avatar', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    
    // Get the file path relative to the server
    const relativePath = `/uploads/${path.basename(req.file.path)}`;
    
    // Update user profile image in database with the relative path
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: relativePath },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove avatar route
router.delete('/remove-avatar', protect, async (req, res) => {
  try {
    // Get user with profile image path
    const user = await User.findById(req.user._id);
    
    // If user has a profile image, try to delete the file
    if (user.profileImage && user.profileImage.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', user.profileImage);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting avatar file:', err);
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
