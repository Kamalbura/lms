import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the base API configuration
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Get token from auth state
      const token = getState().auth.token;
      
      // If token exists, include it in the headers
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: ['User', 'Course', 'Enrollment', 'Assessment', 'Submission'],
  endpoints: (builder) => ({}),
});

// Placeholder for API slice (RTK Query or custom API logic)

// Auth endpoints
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getProfile: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: '/auth/password',
        method: 'PUT',
        body: passwordData,
      }),
    }),
    uploadAvatar: builder.mutation({
      query: (formData) => ({
        url: '/auth/upload-avatar',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
    removeAvatar: builder.mutation({
      query: () => ({
        url: '/auth/remove-avatar',
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Enrollment endpoints
export const enrollmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyEnrollments: builder.query({
      query: () => '/enroll/me',
      providesTags: ['Enrollment'],
    }),
    enrollInCourse: builder.mutation({
      query: (courseId) => ({
        url: `/enroll/${courseId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Enrollment'],
    }),
    getEnrollmentDetails: builder.query({
      query: (courseId) => `/enroll/${courseId}/details`,
      providesTags: ['Enrollment'],
    }),
    markLessonComplete: builder.mutation({
      query: ({ courseId, lessonId }) => ({
        url: `/enroll/${courseId}/complete-lesson`,
        method: 'POST',
        body: { lessonId },
      }),
      invalidatesTags: ['Enrollment'],
    }),
    markLessonIncomplete: builder.mutation({
      query: ({ courseId, lessonId }) => ({
        url: `/enroll/${courseId}/incomplete-lesson`,
        method: 'POST',
        body: { lessonId },
      }),
      invalidatesTags: ['Enrollment'],
    }),
  }),
});

// Export the auto-generated hooks
export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
} = authApi;

export const {
  useGetMyEnrollmentsQuery,
  useEnrollInCourseMutation,
  useGetEnrollmentDetailsQuery,
  useMarkLessonCompleteMutation,
  useMarkLessonIncompleteMutation,
} = enrollmentApi;
