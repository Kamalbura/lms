import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const TakeAssessment = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch assessment
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/assessments/${assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssessment(data);
        
        // Initialize answers object with empty values for each question
        const initialAnswers = {};
        data.questions.forEach((question, index) => {
          initialAnswers[index] = { questionId: question._id, answer: '' };
        });
        setAnswers(initialAnswers);
        
        // Set timer if this is a timed assessment
        if (data.timeLimit) {
          setTimeLeft(data.timeLimit * 60); // Convert minutes to seconds
        }
        
        setStartTime(Date.now());
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssessment();
  }, [assessmentId, token]);
  
  // Timer effect
  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      // Auto-submit when time is up
      handleSubmit();
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft]);
  
  // Format time for display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle answer changes
  const handleAnswerChange = (questionId, value) => {
    const updatedAnswers = { ...answers };
    
    // Find the index of the question in the answers object
    const index = Object.keys(updatedAnswers).find(
      key => updatedAnswers[key].questionId === questionId
    );
    
    if (index !== undefined) {
      updatedAnswers[index].answer = value;
      setAnswers(updatedAnswers);
    }
  };
  
  // Submit assessment
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Calculate time taken in minutes
      const timeTaken = Math.round((Date.now() - startTime) / (1000 * 60));
      
      // Format answers array
      const formattedAnswers = Object.values(answers);
      
      await axios.post(
        `/api/assessments/submit/${assessmentId}`,
        { 
          answers: formattedAnswers,
          timeTaken
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Redirect to dashboard or results page
      navigate('/my-submissions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };
  
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
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  if (!assessment) {
    return (
      <div className="container mx-auto p-4">
        <p>Assessment not found.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Assessment Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{assessment.title}</h1>
            <p className="text-gray-600">{assessment.description}</p>
          </div>
          
          {timeLeft !== null && (
            <div className="text-center">
              <p className="text-sm text-gray-500">Time Remaining</p>
              <p className={`text-xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          )}
        </div>
        
        {/* Questions */}
        <div className="space-y-8">
          {assessment.questions.map((question, index) => (
            <div key={question._id} className="p-4 border rounded-lg">
              <h3 className="font-bold mb-2">
                Question {index + 1}
                {question.points && <span className="text-sm text-gray-500 ml-2">({question.points} points)</span>}
              </h3>
              
              <p className="mb-4">{question.text}</p>
              
              {question.type === 'mcq' ? (
                <div className="space-y-2">
                  {question.options.map((option, oIdx) => (
                    <div key={oIdx} className="flex items-center">
                      <input
                        type="radio"
                        id={`q${index}-option${oIdx}`}
                        name={`question-${question._id}`}
                        checked={answers[index]?.answer === option}
                        onChange={() => handleAnswerChange(question._id, option)}
                        className="mr-2"
                      />
                      <label htmlFor={`q${index}-option${oIdx}`}>
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3">
                  <textarea
                    rows="3"
                    value={answers[index]?.answer || ''}
                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeAssessment;
