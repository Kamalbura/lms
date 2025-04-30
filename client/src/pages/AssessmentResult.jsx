import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import ImageWithFallback from '../components/ImageWithFallback';

const AssessmentResult = () => {
  const { submissionId, assessmentId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch submission details
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/assessments/submissions/${submissionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSubmission(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [submissionId, token]);
  
  // Calculate score percentage
  const calculatePercentage = () => {
    if (!submission || submission.maxPossibleScore === 0) return 0;
    return Math.round((submission.totalScore / submission.maxPossibleScore) * 100);
  };

  // Add a function to give feedback based on score percentage
  const getFeedbackMessage = (percentage) => {
    if (percentage >= 90) return "Excellent work! You've mastered this material.";
    if (percentage >= 75) return "Great job! You have a good understanding of the content.";
    if (percentage >= 60) return "Good effort. Review the topics you missed to strengthen your knowledge.";
    if (percentage >= 40) return "You're on the right track, but need more practice with this material.";
    return "You'll need to review this material more thoroughly. Don't give up!";
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
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }
  
  if (!submission) {
    return (
      <div className="container mx-auto p-4">
        <p>Submission not found.</p>
      </div>
    );
  }
  
  const percentage = calculatePercentage();
  const scoreClass = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Assessment Results</h1>
          
          {/* Assessment Info */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              {submission.assessment.title}
            </h2>
            <p className="text-gray-600">{submission.assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}</p>
            <p className="text-sm text-gray-500">
              Submitted on {new Date(submission.submittedAt).toLocaleString()}
            </p>
            {submission.timeTaken && (
              <p className="text-sm text-gray-500">
                Time taken: {submission.timeTaken} minutes
              </p>
            )}
          </div>
          
          {/* Score Summary */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">Your Score</h3>
              <div className={`text-2xl font-bold ${scoreClass}`}>
                {submission.totalScore} / {submission.maxPossibleScore}
                <span className="ml-2 text-base">({percentage}%)</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full ${
                  percentage >= 70 ? 'bg-green-600' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-600'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            {/* Status Badge */}
            <div className="text-right">
              <span className={`inline-block px-2 py-1 text-xs rounded ${
                submission.status === 'graded' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {submission.status === 'graded' ? 'Graded' : 'Submitted'}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Feedback:</h4>
              <p className="text-gray-600">{getFeedbackMessage(percentage)}</p>
            </div>
            
            {/* Add a review button for incorrect answers */}
            {percentage < 100 && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    const firstIncorrectAnswer = submission.answers.findIndex(a => !a.isCorrect);
                    if (firstIncorrectAnswer >= 0) {
                      document.getElementById(`question-${firstIncorrectAnswer}`).scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                      });
                    }
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Review incorrect answers
                </button>
              </div>
            )}
          </div>
          
          {/* Answer Review */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2">Review Answers</h3>
            
            {submission.answers.map((answer, index) => {
              // Find the corresponding question from the assessment
              const question = submission.assessment.questions?.find(
                q => q._id.toString() === answer.questionId.toString()
              );
              
              if (!question) return null;
              
              return (
                <div id={`question-${index}`} key={answer.questionId} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {answer.points} / {question.points} points
                      </span>
                      {answer.isCorrect !== undefined && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="mb-3">{question.text}</p>
                  
                  {question.type === 'mcq' ? (
                    <div className="space-y-2">
                      {question.options.map((option, oIdx) => (
                        <div 
                          key={oIdx} 
                          className={`p-2 rounded ${
                            option === question.correctAnswer
                              ? 'bg-green-50 border border-green-200'
                              : option === answer.answer && option !== question.correctAnswer
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          {option === answer.answer && (
                            <span className="mr-2">✓</span>
                          )}
                          {option}
                          {option === question.correctAnswer && (
                            <span className="ml-2 text-green-600 text-xs">(Correct Answer)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-500 mb-1">Your Answer:</p>
                        <p>{answer.answer || 'No answer provided'}</p>
                      </div>
                      
                      {submission.status === 'graded' && (
                        <div className="p-3 bg-gray-50 rounded border">
                          <p className="text-sm text-gray-500 mb-1">Feedback:</p>
                          <p>{answer.feedback || 'No feedback provided'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Overall Feedback */}
          {submission.feedback && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Instructor Feedback</h3>
              <p>{submission.feedback}</p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="mt-8 flex justify-between">
            <Link
              to="/my-submissions"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              View All Submissions
            </Link>
            
            <Link
              to={`/course/${submission.assessment.course.slug}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResult;
