import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';

const LessonView = ({ course, enrollment }) => {
  const { token } = useSelector(state => state.auth);
  const [expandedModule, setExpandedModule] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (enrollment && enrollment.completedLessons) {
      setCompletedLessons(enrollment.completedLessons);
    }
  }, [enrollment]);
  
  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };
  
  const handleToggleLessonCompletion = async (lessonId) => {
    if (!enrollment) return;
    
    setLoading(true);
    try {
      const isCompleted = isLessonCompleted(lessonId);
      const endpoint = isCompleted ? 'incomplete-lesson' : 'complete-lesson';
      
      const { data } = await axios.post(
        `/api/enroll/${course._id}/${endpoint}`, 
        { lessonId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCompletedLessons(data.enrollment.completedLessons);
      toast.success(isCompleted ? 'Lesson marked as incomplete' : 'Lesson marked as complete!');
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update lesson status');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateModuleProgress = (moduleIndex) => {
    if (!course || !course.modules[moduleIndex] || !course.modules[moduleIndex].lessons) return 0;
    
    const moduleLessons = course.modules[moduleIndex].lessons;
    if (moduleLessons.length === 0) return 0;
    
    const completedModuleLessons = moduleLessons.filter(
      lesson => isLessonCompleted(lesson._id)
    ).length;
    
    return Math.round((completedModuleLessons / moduleLessons.length) * 100);
  };
  
  if (!course || !course.modules) return null;
  
  return (
    <div className="space-y-6 mt-4">
      {course.modules.map((module, moduleIndex) => (
        <div key={moduleIndex} className="border rounded-md overflow-hidden">
          {/* Module Header */}
          <div 
            className={`p-4 flex justify-between items-center cursor-pointer ${
              moduleIndex === expandedModule ? 'bg-blue-50' : 'bg-gray-50'
            }`}
            onClick={() => setExpandedModule(moduleIndex === expandedModule ? -1 : moduleIndex)}
          >
            <div>
              <h3 className="text-lg font-medium">Module {moduleIndex + 1}: {module.title}</h3>
              <div className="text-sm text-gray-500">{module.lessons?.length || 0} lessons</div>
            </div>
            
            <div className="flex items-center">
              {/* Module Progress */}
              <div className="mr-4 text-sm">
                <span className="font-medium">{calculateModuleProgress(moduleIndex)}%</span>
              </div>
              
              <svg
                className={`w-5 h-5 transform transition-transform ${moduleIndex === expandedModule ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Lessons List */}
          {moduleIndex === expandedModule && (
            <div className="divide-y">
              {module.lessons && module.lessons.map((lesson, lessonIndex) => (
                <div key={lessonIndex} className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="mr-3">Lesson {lessonIndex + 1}:</span>
                    <div>
                      <h4 className="font-medium">{lesson.title}</h4>
                      <div className="text-sm text-gray-500">{lesson.duration || 0} min</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {enrollment && (
                      <button
                        onClick={() => handleToggleLessonCompletion(lesson._id)}
                        disabled={loading}
                        className={`flex items-center mr-2 px-3 py-1 rounded text-sm ${
                          isLessonCompleted(lesson._id)
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {isLessonCompleted(lesson._id) ? (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Completed
                          </>
                        ) : (
                          <>Mark Complete</>
                        )}
                      </button>
                    )}
                    
                    <button 
                      className="text-blue-600 hover:underline text-sm"
                      onClick={() => {
                        // Implement view lesson content logic here
                        toast.info(`Lesson content: ${lesson.title}`);
                      }}
                    >
                      View Content
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Module Progress Bar */}
          <div className="h-1.5 bg-gray-200">
            <div 
              className="h-1.5 bg-blue-500 transition-all duration-300" 
              style={{ width: `${calculateModuleProgress(moduleIndex)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LessonView;
