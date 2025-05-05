import axios from 'axios';
import toast from 'react-hot-toast';
import { getToken } from './utils/auth';

// Create axios instance with default config
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // For debugging
    console.error('API Error:', error);

    // Handle network errors (server not reachable)
    if (!error.response) {
      toast.error('Cannot connect to server. Please check your internet connection or try again later.');
      return Promise.reject(error);
    }
    
    // Extract error message
    const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
    
    // Handle specific error codes
    switch (error.response.status) {
      case 401:
        // Unauthorized
        toast.error('Your session has expired. Please login again.');
        // Could dispatch a logout action here
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('The requested resource was not found.');
        break;
      case 500:
        toast.error('Server error. Our team has been notified.');
        break;
      default:
        // For other error codes
        if (error.response.status >= 400 && error.response.status < 500) {
          toast.error(errorMessage);
        } else {
          toast.error('Something went wrong. Please try again later.');
        }
    }

    return Promise.reject(error);
  }
);

export default instance;
