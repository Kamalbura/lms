import logger from '../utils/logger.js';
import { handleValidationError, handleDBError, logError, sendErrorResponse, AppError } from '../utils/errorHandler.js';

// Error handling middleware for all environments
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Log the error
  logError(err, req.originalUrl);
  
  // Handle known error types
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new AppError(`Duplicate field value: ${field} with value: ${value}`, 400, 'DUPLICATE_VALUE');
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');
  }
  
  // Send standardized error response
  sendErrorResponse(error, res);
};

// 404 Not Found middleware
export const notFound = (req, res, next) => {
  const error = new AppError(`Resource not found - ${req.originalUrl}`, 404, 'RESOURCE_NOT_FOUND');
  next(error);
};
