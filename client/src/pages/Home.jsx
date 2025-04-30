import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Welcome to ProLearn LMS</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A comprehensive learning management system for students and educators
        </p>
        
        <div className="mt-8">
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="space-x-4">
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Comprehensive Courses</h2>
          <p className="text-gray-600">
            Access a wide range of courses with rich content and interactive learning materials.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Progress Tracking</h2>
          <p className="text-gray-600">
            Track your learning progress with detailed analytics and completion certificates.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Assessments & Quizzes</h2>
          <p className="text-gray-600">
            Test your knowledge with assessments and get immediate feedback on your performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
