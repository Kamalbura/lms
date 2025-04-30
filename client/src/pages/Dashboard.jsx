import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import ImageWithFallback from '../components/ImageWithFallback';

const Dashboard = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('enrolled');
  
  const { user, token, isAuthenticated } = useSelector(state => state.auth);
  
  // Helper function to calculate total lessons in a course
  const getTotalLessons = (course) => {
    if (!course || !course.modules) return 0;
    return course.modules.reduce((total, module) => {
      return total + (module.lessons ? module.lessons.length : 0);
    }, 0);
  };

  // Add helper function to get full URL for images
  const getFullImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/') 
      ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`
      : path;
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      setError('You must be logged in to view your dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student enrollments
        const { data: enrollmentsData } = await axios.get(
          '/api/enroll/me',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEnrollments(enrollmentsData);
        
        // If user is instructor or admin, fetch their courses
        if (user && (user.role === 'instructor' || user.role === 'admin')) {
          const { data: coursesData } = await axios.get(
            '/api/courses/instructor/courses',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setInstructorCourses(coursesData);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, user, isAuthenticated]);
  
  const isInstructor = user && (user.role === 'instructor' || user.role === 'admin');
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      
      {/* Tabs for different dashboard sections */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`py-2 px-4 ${
              activeTab === 'enrolled'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
          >
            My Enrolled Courses
          </button>
          
          {isInstructor && (
            <button
              onClick={() => setActiveTab('teaching')}
              className={`py-2 px-4 ${
                activeTab === 'teaching'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500'
              }`}
            >
              My Teaching Courses
            </button>
          )}
        </div>
      </div>
      
      {/* Enrolled courses tab content */}
      {activeTab === 'enrolled' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Enrolled Courses</h2>
          
          {enrollments.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
              <Link
                to="/"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  {/* Course thumbnail with overlay for completion status */}
                  <div className="relative">
                    {enrollment.course.thumbnail ? (
                      <ImageWithFallback
                        src={getFullImageUrl(enrollment.course.thumbnail)}
                        alt={enrollment.course.title}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">{enrollment.course.title.charAt(0)}</span>
                      </div>
                    )}
                    
                    {/* Course completion badge overlay */}
                    {enrollment.progress === 100 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        Completed
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {enrollment.course.title}
                    </h3>
                    
                    {/* Progress section with enhanced styling */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Your progress</span>
                        <span className="text-sm font-medium">{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            enrollment.progress === 100 
                              ? 'bg-green-600' 
                              : enrollment.progress > 75 
                              ? 'bg-blue-600' 
                              : enrollment.progress > 25 
                              ? 'bg-blue-500' 
                              : 'bg-blue-400'
                          }`}
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Course stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-500">
                      <div>
                        <span className="block font-medium">Last Access</span>
                        <span>{enrollment.lastAccessed ? new Date(enrollment.lastAccessed).toLocaleDateString() : 'Not started'}</span>
                      </div>
                      <div>
                        <span className="block font-medium">Lessons Completed</span>
                        <span>{enrollment.completedLessons?.length || 0} of {getTotalLessons(enrollment.course)}</span>
                      </div>
                    </div>
                    
                    <Link
                      to={`/course/${enrollment.course.slug}`}
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition-colors"
                    >
                      {enrollment.progress === 100 ? 'Review Course' : 'Continue Learning'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Teaching courses tab content (for instructors) */}
      {activeTab === 'teaching' && isInstructor && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Teaching Courses</h2>
            <div className="flex space-x-3">
              <Link
                to="/instructor/assessments"
                className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
              >
                Manage Assessments
              </Link>
              <Link
                to="/course/create"
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
              >
                Create New Course
              </Link>
            </div>
          </div>
          
          {instructorCourses.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-500">You haven't created any courses yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructorCourses.map((course) => (
                <div
                  key={course._id}
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {course.thumbnail && (
                    <ImageWithFallback
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/course/${course.slug}`}
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        to={`/course/edit/${course.slug}`}
                        className="text-green-500 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
