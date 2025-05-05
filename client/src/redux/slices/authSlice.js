import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setToken, getToken, removeToken } from '../../utils/auth';

// Load token from storage on app startup
const initialToken = getToken();

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/auth/register', userData);
      setToken(data.token);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      console.error('Registration error:', error.response?.data || error.message);
      return rejectWithValue(message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/auth/login', userData);
      
      if (!data || !data.token) {
        throw new Error('Invalid response from server. Missing token.');
      }
      
      setToken(data.token);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      console.error('Login error:', error.response?.data || error.message);
      return rejectWithValue(message);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || initialToken;
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.get('/api/auth/me', config);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to load profile';
      console.error('Get user profile error:', error.response?.data || error.message);
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      
      // Call logout endpoint (don't wait for it)
      if (token) {
        axios.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Error during logout API call:', err.message);
        });
      }
      
      // Always clear local storage
      removeToken();
      return null;
    } catch (error) {
      console.error('Error in logout process:', error);
      // Still clear token on error
      removeToken();
      return null;
    }
  }
);

const initialState = {
  token: initialToken,
  isAuthenticated: !!initialToken,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    resetAuth: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.loading = false;
      removeToken();
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get User Profile
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // If API call failed due to auth issues, clear auth state
        if (
          action.payload === 'Not authorized, token failed' ||
          action.payload === 'Not authorized, no token' ||
          action.payload === 'No token found'
        ) {
          state.token = null;
          state.isAuthenticated = false;
          state.user = null;
          removeToken();
        }
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setCredentials, resetAuth } = authSlice.actions;
export default authSlice.reducer;
