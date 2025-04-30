import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const CreateAssessment = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { token } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('quiz');
  const [dueDate, setDueDate] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [questions, setQuestions] = useState([
    { text: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: '', points: 1 }
  ]);
  const [isPublished, setIsPublished] = useState(false);
  
  // Fetch course details to verify instructor permissions
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourse(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course');
      }
    };
    
    if (courseId) fetchCourse();
  }, [courseId, token]);
  
  // Add file upload handler for assessment materials if needed
  const handleFileUpload = async (file) => {
    if (!file) return null;
    
    // Max size check
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size should be less than 10MB');
    }
    
    const formData = new FormData();
    formData.append('material', file);
    
    try {
      const { data } = await axios.post('/api/uploads/assessment-material', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return data.filePath;
    } catch (err) {
      throw new Error('Failed to upload file');
    }
  };

  // Add a new question
  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { text: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: '', points: 1 }
    ]);
  };
  
  // Remove a question
  const removeQuestion = (index) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };
  
  // Update question field
  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };
  
  // Update option text
  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };
  
  // Add option to an MCQ
  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };
  
  // Remove option from an MCQ
  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(updatedQuestions);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Format the data
      const assessmentData = {
        title,
        description,
        type,
        questions,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        course: course._id,
        isPublished
      };
      
      await axios.post('/api/assessments', assessmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate(`/course/${course.slug}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };
  
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
      <h1 className="text-2xl font-bold mb-6">Create New Assessment</h1>
      
      {course && (
        <div className="mb-4">
          <p className="text-gray-600">
            Course: <span className="font-medium">{course.title}</span>
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Assessment Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {type === 'quiz' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                Publish immediately
              </label>
            </div>
          </div>
          
          {/* Questions Section */}
          <div className="space-y-8">
            <h2 className="text-xl font-semibold border-b pb-2">Questions</h2>
            
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border p-4 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Question {qIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text
                    </label>
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="short">Short Answer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      required
                    />
                  </div>
                  
                  {question.type === 'mcq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options
                      </label>
                      
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center mb-2">
                          <input
                            type="radio"
                            name={`correctAnswer-${qIndex}`}
                            checked={question.correctAnswer === option}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', option)}
                            className="mr-2"
                          />
                          
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
                            placeholder={`Option ${oIndex + 1}`}
                            required
                          />
                          
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="ml-2 text-red-500"
                            disabled={question.options.length <= 2}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-blue-500 text-sm"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}
                  
                  {question.type === 'short' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Answer Key
                      </label>
                      <input
                        type="text"
                        value={question.correctAnswer || ''}
                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Model answer or key words"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-gray-700"
            >
              + Add Question
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {loading ? 'Creating...' : 'Create Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssessment;
