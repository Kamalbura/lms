import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const MyAssessments = () => {
  const [courses, setCourses] = useState([]);
  const [courseAssessments, setCourseAssessments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/enroll/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(data);
        
        // Fetch assessments for each course
        const assessmentsPromises = data.map(enrollment => 
          axios.get(`/api/assessments/course/${enrollment.course._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        
        const assessmentsResults = await Promise.all(assessmentsPromises);
        
        // Organize assessments by course ID
        const assessmentsByCourse = {};
        assessmentsResults.forEach((result, index) => {
          assessmentsByCourse[data[index].course._id] = result.data;
        });
        
        setCourseAssessments(assessmentsByCourse);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEnrolledCourses();
  }, [token]);
  
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
      <h1 className="text-3xl font-bold mb-6">My Assessments</h1>
      
      {courses.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
          <Link
            to="/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {courses.map(enrollment => {
            const courseId = enrollment.course._id;
            const assessments = courseAssessments[courseId] || [];
            
            return (
              <div key={courseId} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold">{enrollment.course.title}</h2>
                </div>
                
                {assessments.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No assessments available for this course yet.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {assessments.map(assessment => (
                      <div key={assessment._id} className="p-6 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-lg">{assessment.title}</h3>
                          <p className="text-sm text-gray-500">
                            {assessment.type === 'quiz' ? 'Quiz' : 'Assignment'} • 
                            {assessment.totalPoints} points
                            {assessment.dueDate && (
                              <span> • Due: {new Date(assessment.dueDate).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                        
                        <Link
                          to={`/assessment/${assessment._id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Start
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAssessments;
