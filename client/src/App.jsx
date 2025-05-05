import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getUserProfile } from './redux/slices/authSlice';
import { initializeSocket } from './redux/slices/interactionSlice';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CoursesList from './pages/CoursesList';
import CourseDetail from './pages/CourseDetail';
import CourseCreate from './pages/CourseCreate';
import CourseEdit from './pages/CourseEdit';
import MyAssessments from './pages/MyAssessments';
import TakeAssessment from './pages/TakeAssessment';
import AssessmentResult from './pages/AssessmentResult';
import CreateAssessment from './pages/CreateAssessment';
import InstructorAssessments from './pages/InstructorAssessments';
import AssessmentSubmissions from './pages/AssessmentSubmissions';
import GradeSubmission from './pages/GradeSubmission';
import MySubmissions from './pages/MySubmissions';
import ConfigPage from './pages/ConfigPage';

function App() {
  const dispatch = useDispatch();
  
  // Try to auto-login and initialize socket on app startup
  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(getUserProfile())
        .then((result) => {
          if (!result.error) {
            dispatch(initializeSocket());
          }
        })
        .catch((err) => {
          console.error('Auto-login failed:', err);
          localStorage.removeItem('token');
        });
    }
  }, [dispatch]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public routes wrapped in MainLayout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="courses" element={<CoursesList />} />
            <Route path="course/:slug" element={<CourseDetail />} />

            {/* Protected routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="my-assessments" element={
              <ProtectedRoute>
                <MyAssessments />
              </ProtectedRoute>
            } />
            <Route path="assessment/:assessmentId" element={
              <ProtectedRoute>
                <TakeAssessment />
              </ProtectedRoute>
            } />
            <Route path="assessment/:assessmentId/result/:submissionId" element={
              <ProtectedRoute>
                <AssessmentResult />
              </ProtectedRoute>
            } />
            <Route path="my-submissions" element={
              <ProtectedRoute>
                <MySubmissions />
              </ProtectedRoute>
            } />

            {/* Instructor routes */}
            <Route path="course/create" element={
              <ProtectedRoute>
                <CourseCreate />
              </ProtectedRoute>
            } />
            <Route path="course/edit/:slug" element={
              <ProtectedRoute>
                <CourseEdit />
              </ProtectedRoute>
            } />
            <Route path="create-assessment" element={
              <ProtectedRoute>
                <CreateAssessment />
              </ProtectedRoute>
            } />
            <Route path="instructor/assessments" element={
              <ProtectedRoute>
                <InstructorAssessments />
              </ProtectedRoute>
            } />
            <Route path="assessment-submissions/:assessmentId" element={
              <ProtectedRoute>
                <AssessmentSubmissions />
              </ProtectedRoute>
            } />
            <Route path="grade-submission/:submissionId" element={
              <ProtectedRoute>
                <GradeSubmission />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="config" element={
              <ProtectedRoute>
                <ConfigPage />
              </ProtectedRoute>
            } />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
