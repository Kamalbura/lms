import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Middleware to protect routes - verifies JWT token
export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user to request object (without password)
      const user = await User.findById(decoded.id).select('-password');
      
      // Check if user still exists
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      
      // Check if user changed password after token was issued
      if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({ message: 'Password changed recently, please log in again' });
      }
      
      // User is valid, proceed
      req.user = user;
      next();
    } catch (error) {
      logger.warn(`Authentication failed: ${error.message}`);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Authentication token expired, please log in again' });
      } 
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid authentication token' });
      }
      
      res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    logger.error(`Server error in auth middleware: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Middleware to restrict access based on roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not authorized to access this resource`
      });
    }
    next();
  };
};
