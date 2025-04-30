import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const GradeSubmission = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/assessments/submissions/${submissionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSubmission(data);
        // Initialize grading form with current answers
        setAnswers(data.answers.map(ans => ({
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect: ans.isCorrect || false,
          points: ans.points || 0,
          feedback: ans.feedback || ''
        })));
        
        setFeedback(data.feedback || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [submissionId, token]);
  
  const updateAnswer = (index, field, value) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = { ...updatedAnswers[index], [field]: value };
    setAnswers(updatedAnswers);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      await axios.put(
        `/api/assessments/grade/${submissionId}`,
        { 
          answers,
          feedback
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Submission graded successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/assessment-submissions/${submission.assessment._id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to grade submission');
    } finally {
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
  
  if (error && !submission) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Grade Submission</h1>
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Assessment:</span> {submission.assessment.title}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Student:</span> {submission.user.name} ({submission.user.email})
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Submitted:</span> {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {answers.map((answer, index) => {
            // Find the corresponding question
            const question = submission.assessment.questions.find(
              q => q._id.toString() === answer.questionId.toString()
            );
            
            if (!question) return null;
            
            return (
              <div key={answer.questionId} className="p-4 border rounded-lg">
                <div className="mb-4">
                  <h3 className="font-medium">Question {index + 1}</h3>
                  <p className="mt-1">{question.text}</p>
                  
                  {/* Student's answer */}
                  <div className="mt-3 p-3 bg-gray-50 rounded border">
                    <p className="text-sm text-gray-500 mb-1">Student's Answer:</p>
                    {question.type === 'mcq' ? (
                      <p>{answer.answer}</p>
                    ) : (
                      <p className="whitespace-pre-wrap">{answer.answer || 'No answer provided'}</p>
                    )}
                  </div>
                  
                  {question.type === 'mcq' && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-1">Correct Answer:</p>
                      <p>{question.correctAnswer}</p>
                    </div>
                  )}
                </div>
                
                {/* Grading inputs */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points (max: {question.points})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={question.points}
                      value={answer.points}
                      onChange={e => updateAnswer(index, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`correct-${index}`}
                      checked={answer.isCorrect}
                      onChange={e => updateAnswer(index, 'isCorrect', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`correct-${index}`} className="text-sm font-medium text-gray-700">
                      Mark as correct
                    </label>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback for this answer
                    </label>
                    <textarea
                      value={answer.feedback}
                      onChange={e => updateAnswer(index, 'feedback', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="2"
                      placeholder="Provide feedback on this answer..."
                    />
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Overall feedback */}
          <div className="p-4 border rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Feedback
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="4"
              placeholder="Provide overall feedback on the submission..."
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {submitting ? 'Saving...' : 'Submit Grades'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeSubmission;
