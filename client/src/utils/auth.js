/**
 * Authentication utility functions for the ProLearn LMS
 */

// Set auth token in localStorage
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

// Get auth token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Remove auth token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// Get user role from JWT token (without verification)
export const getUserRoleFromToken = (token) => {
  if (!token) return null;
  
  try {
    // Extract payload from JWT token
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

// Add authorization header with JWT token
export const authHeader = () => {
  const token = getToken();
  
  if (token) {
    return { Authorization: `Bearer ${token}` };
  } else {
    return {};
  }
};
