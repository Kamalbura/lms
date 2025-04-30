import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import ImageWithFallback from '../components/ImageWithFallback';

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector(state => state.auth);

  const [filter, setFilter] = useState('all'); // 'all', 'graded', 'submitted'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/assessments/submissions/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubmissions(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [token]);

  // Helper function to get status badge color
  const getStatusBadgeColor = status => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.submittedAt) - new Date(a.submittedAt);
    if (sortOrder === 'oldest') return new Date(a.submittedAt) - new Date(b.submittedAt);
    if (sortOrder === 'highest') {
      const scoreA = a.status === 'graded' ? (a.totalScore / a.maxPossibleScore) * 100 : 0;
      const scoreB = b.status === 'graded' ? (b.totalScore / b.maxPossibleScore) * 100 : 0;
      return scoreB - scoreA;
    }
    if (sortOrder === 'lowest') {
      const scoreA = a.status === 'graded' ? (a.totalScore / a.maxPossibleScore) * 100 : 0;
      const scoreB = b.status === 'graded' ? (b.totalScore / b.maxPossibleScore) * 100 : 0;
      return scoreA - scoreB;
    }
    return 0;
  });

  // Add statistics section
  const calculateStats = () => {
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');
    if (gradedSubmissions.length === 0) return { average: 0, highest: 0, completed: 0 };

    const scores = gradedSubmissions.map(s => (s.totalScore / s.maxPossibleScore) * 100);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      average: Math.round(average),
      highest: Math.round(Math.max(...scores)),
      completed: submissions.length
    };
  };

  const stats = calculateStats();

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
      <h1 className="text-3xl font-bold mb-6">My Submissions</h1>

      {/* Stats summary */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Average Score</p>
          <p className="text-2xl font-bold text-blue-600">{stats.average}%</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Highest Score</p>
          <p className="text-2xl font-bold text-green-600">{stats.highest}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Assessments Completed</p>
          <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
        </div>
      </div>

      {/* Filter and sort controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All submissions</option>
            <option value="graded">Graded</option>
            <option value="submitted">Pending</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest score</option>
            <option value="lowest">Lowest score</option>
          </select>
        </div>
      </div>

      {sortedSubmissions.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500 mb-4">You haven't submitted any assessments yet.</p>
          <Link
            to="/my-assessments"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Assessments
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSubmissions.map(submission => {
                const scorePercentage = submission.maxPossibleScore > 0
                  ? Math.round((submission.totalScore / submission.maxPossibleScore) * 100)
                  : 0;

                return (
                  <tr key={submission._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.assessment.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {submission.assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {submission.assessment.course.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.status === 'graded' ? (
                        <div className="text-sm text-gray-900">
                          {submission.totalScore} / {submission.maxPossibleScore}
                          <span className="ml-1 text-xs text-gray-500">({scorePercentage}%)</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Pending</div>
                      )}
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
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/assessment/${submission.assessment._id}/result/${submission._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Results
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MySubmissions;
