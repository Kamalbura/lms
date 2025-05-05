import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import interactionReducer from './slices/interactionSlice';
import { api } from './api/apiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    interaction: interactionReducer,
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(api.middleware),
});

export default store;
