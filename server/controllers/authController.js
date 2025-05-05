import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Generate JWT token
const generateToken = (user) => {
  try {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production',
      { expiresIn: '7d' }
    );
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Could not generate authentication token');
  }
};

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student' // Default to student if no role provided
    });
    
    // Generate token and send response
    if (user) {
      const token = generateToken(user);
      
      // Log the registration
      logger.info(`New user registered: ${user.email}`, {
        userId: user._id,
        role: user.role
      });
      
      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    logger.error('Error in registerUser:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Login existing user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (isMatch) {
      const token = generateToken(user);
      
      // Log successful login
      logger.info(`User logged in: ${user.email}`, {
        userId: user._id,
        role: user.role
      });
      
      // Return response without password
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || null
      };
      
      return res.json({
        token,
        user: userResponse
      });
    } else {
      // Log failed login attempt
      logger.warn(`Failed login attempt for user: ${email}`, { userId: user._id });
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    logger.error('Error in loginUser:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    // Make sure req.user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    logger.error('Error in getCurrentUser:', error);
    res.status(500).json({ message: 'Server error while retrieving profile', error: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update name if provided
    if (name) {
      user.name = name;
    }
    
    // Save the updated user
    await user.save();
    
    // Log profile update
    logger.info(`User profile updated: ${user.email}`, {
      userId: user._id,
      updates: Object.keys(req.body)
    });
    
    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Error in updateProfile:', error);
    res.status(500).json({ message: "Server error during profile update", error: error.message });
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new passwords are required" });
    }
    
    // Find user with password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Update password
    user.password = newPassword;
    
    // Save the updated user (password will be hashed via pre-save hook)
    await user.save();
    
    // Log password change
    logger.info(`User password changed: ${user.email}`, {
      userId: user._id
    });
    
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    logger.error('Error in changePassword:', error);
    res.status(500).json({ message: "Server error during password change", error: error.message });
  }
};

// Logout user
export const logoutUser = async (req, res) => {
  try {
    // For client-side logout, we don't need to do much on the server
    // Just log the event if we have user info
    if (req.user) {
      logger.info(`User logged out: ${req.user.email}`, {
        userId: req.user._id
      });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Error in logoutUser:', error);
    res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
};
