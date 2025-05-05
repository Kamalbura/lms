import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { fetchInstructorCourses } from '../redux/slices/courseSlice';
import ImageWithFallback from '../components/ImageWithFallback';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('enrolled');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector(state => state.auth);
  const { instructorCourses, loading: coursesLoading } = useSelector(state => state.courses);
  
  const getTotalLessons = (course) => {
    if (!course || !course.modules) return 0;
    return course.modules.reduce((total, module) => {
      return total + (module.lessons ? module.lessons.length : 0);
    }, 0);
  };

  const getFullImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/') 
      ? `${process.env.REACT_APP_API_URL || ''}${path}`
      : path;
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: enrollmentsData } = await axios.get(
          '/api/enroll/me',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEnrollments(enrollmentsData);
        
        if (user && (user.role === 'instructor' || user.role === 'admin')) {
          dispatch(fetchInstructorCourses());
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        toast.error('Failed to load your courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, user, isAuthenticated, dispatch, navigate]);
  
  const isInstructor = user && (user.role === 'instructor' || user.role === 'admin');
  
  if (loading || coursesLoading) {
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
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Here's an overview of your learning journey</p>
      </div>
      
      {isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Courses</h3>
                <p className="text-gray-500 text-sm">{enrollments.length} enrolled</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full" style={{ width: `${Math.min((enrollments.length / 10) * 100, 100)}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Achievements</h3>
                <p className="text-gray-500 text-sm">
                  {enrollments.filter(e => e.progress === 100).length} completed
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="bg-green-600 h-full" style={{ width: `${(enrollments.filter(e => e.progress === 100).length / Math.max(enrollments.length, 1)) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Overall Progress</h3>
                <p className="text-gray-500 text-sm">
                  {enrollments.reduce((sum, e) => sum + e.progress, 0) / Math.max(enrollments.length, 1)}% average
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-purple-600 h-full" 
                style={{ 
                  width: `${enrollments.reduce((sum, e) => sum + e.progress, 0) / Math.max(enrollments.length, 1)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6 border-b">
        <div className="flex flex-nowrap overflow-x-auto space-x-4 hide-scrollbar">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`py-3 px-4 whitespace-nowrap relative ${
              activeTab === 'enrolled'
                ? 'text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Enrolled Courses
            {activeTab === 'enrolled' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
          
          {isInstructor && (
            <button
              onClick={() => setActiveTab('teaching')}
              className={`py-3 px-4 whitespace-nowrap relative ${
                activeTab === 'teaching'
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Teaching Courses
              {activeTab === 'teaching' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
              )}
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-3 px-4 whitespace-nowrap relative ${
              activeTab === 'assessments'
                ? 'text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Assessments
            {activeTab === 'assessments' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
        </div>
      </div>
      
      {activeTab === 'enrolled' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">My Enrolled Courses</h2>
            <Link
              to="/courses"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              Browse more courses
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
          
          {enrollments.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-soft border border-gray-100 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-blue-50 text-blue-500 rounded-full mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="relative aspect-video">
                    {enrollment.course.thumbnail ? (
                      <ImageWithFallback
                        src={getFullImageUrl(enrollment.course.thumbnail)}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                        {enrollment.course.title.charAt(0)}
                      </div>
                    )}
                    
                    {enrollment.progress === 100 && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium uppercase flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </div>
                    )}
                    
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        {enrollment.course.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {enrollment.course.title}
                    </h3>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Your progress</span>
                        <span className="text-sm font-medium">{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${
                            enrollment.progress === 100 
                              ? 'bg-green-500' 
                              : enrollment.progress > 75 
                              ? 'bg-blue-500' 
                              : enrollment.progress > 25 
                              ? 'bg-blue-400' 
                              : 'bg-blue-300'
                          }`}
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {enrollment.lastAccessed ? new Date(enrollment.lastAccessed).toLocaleDateString() : 'Not started'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>
                          {enrollment.completedLessons?.length || 0}/{getTotalLessons(enrollment.course)}
                        </span>
                      </div>
                    </div>
                    
                    <Link
                      to={`/course/${enrollment.course.slug}`}
                      state={{ 
                        fromDashboard: true,
                        enrollmentId: enrollment._id,
                        lastAccessed: enrollment.lastAccessed
                      }}
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
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
                      src={getFullImageUrl(course.thumbnail)}
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
      
      {activeTab === 'assessments' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">My Assessments</h2>
            <div className="flex space-x-2">
              {isInstructor && (
                <Link
                  to="/create-assessment"
                  className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create
                </Link>
              )}
              <Link
                to="/my-assessments"
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
            <h3 className="text-lg font-medium mb-4">Recent Assessments</h3>
            
            <div className="divide-y">
              {[1, 2, 3].map((item) => (
                <div key={item} className="py-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Assessment Title #{item}</h4>
                    <p className="text-sm text-gray-500">Course Name • Due: Jan {10 + item}, 2024</p>
                  </div>
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
