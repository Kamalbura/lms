/**
 * Authentication utility functions for the ProLearn LMS
 */

// Set auth token in localStorage
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    // Also set in session storage as backup
    sessionStorage.setItem('token_backup', token);
  }
};

// Get auth token from localStorage
export const getToken = () => {
  let token = localStorage.getItem('token');
  
  // If token is not in localStorage but exists in sessionStorage (backup)
  if (!token && sessionStorage.getItem('token_backup')) {
    token = sessionStorage.getItem('token_backup');
    // Restore to localStorage
    localStorage.setItem('token', token);
  }
  
  return token;
};

// Remove auth token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token_backup');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch (error) {
    console.error('Invalid token format:', error);
    removeToken(); // Remove invalid token
    return false;
  }
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
