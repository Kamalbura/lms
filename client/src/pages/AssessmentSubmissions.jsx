import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AssessmentSubmissions = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch assessment details
        const { data: assessmentData } = await axios.get(`/api/assessments/${assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssessment(assessmentData);
        
        // Fetch submissions for this assessment
        const { data: submissionsData } = await axios.get(`/api/assessments/${assessmentId}/submissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubmissions(submissionsData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [assessmentId, token]);
  
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
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{assessment?.title} - Submissions</h1>
          <p className="text-gray-600">{assessment?.type === 'quiz' ? 'Quiz' : 'Assignment'} • {submissions.length} submission(s)</p>
        </div>
        <Link
          to={`/assessment-edit/${assessmentId}`}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Edit Assessment
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submission Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No submissions yet
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {submission.user?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {submission.user?.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      submission.status === 'graded' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.status === 'graded' ? 'Graded' : 'Needs Grading'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.status === 'graded' ? (
                      <div className="text-sm text-gray-900">
                        {submission.totalScore} / {submission.maxPossibleScore}
                        <span className="ml-1 text-xs text-gray-500">
                          ({Math.round((submission.totalScore / submission.maxPossibleScore) * 100)}%)
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Pending</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {assessment.type === 'quiz' ? (
                      <Link 
                        to={`/assessment/${assessmentId}/result/${submission._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Results
                      </Link>
                    ) : (
                      <Link 
                        to={`/grade-submission/${submission._id}`}
                        className={`${
                          submission.status !== 'graded' 
                            ? 'text-orange-600 hover:text-orange-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {submission.status !== 'graded' ? 'Grade Submission' : 'Update Grading'}
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssessmentSubmissions;
