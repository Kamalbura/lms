import { createSlice } from '@reduxjs/toolkit';
import io from 'socket.io-client';
import toast from 'react-hot-toast'; // Add this import

const initialState = {
  socket: null,
  connected: false,
  typingUsers: {},
};

export const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    socketConnected: (state, action) => {
      state.socket = action.payload;
      state.connected = true;
    },
    socketDisconnected: (state) => {
      state.connected = false;
    },
    userStartedTyping: (state, action) => {
      const { userId, context } = action.payload;
      if (!state.typingUsers[context]) {
        state.typingUsers[context] = [];
      }
      if (!state.typingUsers[context].includes(userId)) {
        state.typingUsers[context].push(userId);
      }
    },
    userStoppedTyping: (state, action) => {
      const { userId, context } = action.payload;
      if (state.typingUsers[context]) {
        state.typingUsers[context] = state.typingUsers[context].filter(id => id !== userId);
      }
    },
  },
});

export const { socketConnected, socketDisconnected, userStartedTyping, userStoppedTyping } = interactionSlice.actions;

// Thunk to initialize socket connection
export const initializeSocket = () => (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.token) return;

  // Close existing socket if any
  const { socket: existingSocket } = getState().interaction;  // Renamed to existingSocket
  if (existingSocket && existingSocket.connected) {
    existingSocket.disconnect();  // Use renamed variable
  }

  // Create socket connection
  const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  const newSocket = io(socketUrl, {  // Renamed to newSocket
    auth: {
      token: auth.token
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
  });

  newSocket.on('connect', () => {  // Use renamed variable
    console.log('Socket connected');
    dispatch(socketConnected(newSocket));  // Use renamed variable
  });

  newSocket.on('disconnect', () => {  // Use renamed variable
    console.log('Socket disconnected');
    dispatch(socketDisconnected());
  });

  newSocket.on('connect_error', (error) => {  // Use renamed variable
    console.error('Socket connection error:', error.message);
    toast.error('Lost connection to server. Trying to reconnect...');
  });

  // Add additional socket event listeners here
};

// Thunk to disconnect socket
export const disconnectSocket = () => (dispatch, getState) => {
  const { socket } = getState().interaction;
  if (socket) {
    socket.disconnect();
    dispatch(socketDisconnected());
  }
};

export default interactionSlice.reducer;
