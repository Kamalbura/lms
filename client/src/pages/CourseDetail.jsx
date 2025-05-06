import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import LessonView from '../components/LessonView';
import ImageWithFallback from '../components/ImageWithFallback';
import CourseChat from '../components/CourseChat';
import CompletionCelebration from '../components/CompletionCelebration';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated } = useSelector(state => state.auth);

  // Handler for the continue learning button in the celebration modal
  const handleContinueLearning = () => {
    setShowCelebration(false);
    // Scroll to course content section
    const contentElement = document.getElementById('course-content');
    if (contentElement) {
      contentElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Check if course was just completed
  useEffect(() => {
    if (enrollment && enrollment.progress === 100) {
      // Check if this is first time hitting 100% (using localStorage)
      const completedKey = `completed-${course?._id}`;
      if (!localStorage.getItem(completedKey)) {
        localStorage.setItem(completedKey, 'true');
        setShowCelebration(true);
      }
    }
  }, [enrollment, course]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/courses/${slug}`);
        setCourse(data);
        
        // Check if user is enrolled
        if (isAuthenticated && token) {
          try {
            const { data: enrollmentData } = await axios.get(
              `/api/enroll/${data._id}/check`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsEnrolled(enrollmentData.enrolled);
          } catch (err) {
            console.error('Error checking enrollment:', err);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug, token, isAuthenticated]);

  useEffect(() => {
    if (isEnrolled && course) {
      const fetchEnrollment = async () => {
        try {
          const { data } = await axios.get(`/api/enroll/${course._id}/details`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEnrollment(data);
        } catch (err) {
          console.error('Error fetching enrollment:', err);
        }
      };
      
      fetchEnrollment();
    }
  }, [slug, token, isAuthenticated, isEnrolled, course]);

  useEffect(() => {
    // Check if we're coming from dashboard with specific lesson to resume
    if (location.state?.fromDashboard && course) {
      const enrollmentId = location.state.enrollmentId;
      
      // Scroll to course content section
      const contentElement = document.getElementById('course-content');
      if (contentElement) {
        contentElement.scrollIntoView({ behavior: 'smooth' });
        
        // Find the first incomplete lesson if available
        if (enrollment?.completedLessons && course.modules) {
          let foundIncomplete = false;
          
          // Expand the first module with incomplete lessons
          for (let i = 0; i < course.modules.length; i++) {
            const module = course.modules[i];
            const moduleLessons = module.lessons || [];
            
            for (const lesson of moduleLessons) {
              if (!enrollment.completedLessons.includes(lesson._id)) {
                foundIncomplete = true;
                break;
              }
            }
            
            if (foundIncomplete) break;
          }
        }
      }
    }
  }, [location.state, course, enrollment]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${slug}` } });
      return;
    }

    try {
      await axios.post(
        `/api/enroll/${course._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Instead of redirecting to dashboard, stay on course page and update enrollment state
      setIsEnrolled(true);
      
      // Fetch enrollment details to show progress UI
      const { data: enrollmentData } = await axios.get(
        `/api/enroll/${course._id}/details`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnrollment(enrollmentData);
      
      toast.success('Successfully enrolled in this course!');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
      toast.error(err.response?.data?.message || 'Failed to enroll');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
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

  if (!course) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Show completion celebration if needed */}
      {showCelebration && (
        <CompletionCelebration 
          title="Congratulations!"
          message="You have successfully completed this course."
          onContinue={handleContinueLearning}
          score={enrollment?.progress}
          showConfetti={true}
        />
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {course.thumbnail && (
          <ImageWithFallback 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-64 object-cover" 
          />
        )}
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {course.level}
            </span>
          </div>
          
          <p className="text-gray-600 mb-4">{course.description}</p>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Course Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Category:</p>
                <p>{course.category}</p>
              </div>
              <div>
                <p className="text-gray-600">Instructor:</p>
                <p>{course.instructor?.name || 'Unknown'}</p>
              </div>
              {course.price !== undefined && (
                <div>
                  <p className="text-gray-600">Price:</p>
                  <p>{course.price === 0 ? 'Free' : `$${course.price}`}</p>
                </div>
              )}
            </div>
          </div>
          
          {isEnrolled && (
            <div className="mt-8" id="course-content">
              <h2 className="text-2xl font-bold mb-4">Course Content</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Your progress</span>
                  <span className="font-medium">{enrollment?.progress || 0}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${enrollment?.progress || 0}%` }}
                  ></div>
                </div>
                
                {enrollment?.progress === 100 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-700 font-medium flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Course Completed!
                    </p>
                  </div>
                )}
              </div>
              
              <LessonView 
                course={course} 
                enrollment={enrollment}
                onProgressUpdate={(updatedEnrollment) => setEnrollment(updatedEnrollment)}
                onCourseCompleted={() => setShowCelebration(true)}
              />
              
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Course Discussion</h2>
                <div className="h-96 border border-gray-200 rounded-lg">
                  <CourseChat courseId={course._id} />
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            {isEnrolled ? (
              <div className="flex flex-col items-center">
                <p className="text-green-600 mb-2">You are enrolled in this course</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg w-full md:w-auto"
              >
                Enroll Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
