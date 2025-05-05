import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '../axios';
import { format, parseISO, isBefore } from 'date-fns';
import VideoRoom from './VideoRoom';
import { toast } from 'react-hot-toast';

const OfficeHourScheduler = ({ courseId }) => {
  const { user } = useSelector(state => state.auth);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'video'
  });

  useEffect(() => {
    fetchSessions();
  }, [courseId]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/office-hours');
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load office hours');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/office-hours', {
        ...formData,
        courseId
      });
      setSessions([...sessions, response.data]);
      setShowScheduleForm(false);
      setFormData({
        topic: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'video'
      });
      toast.success('Office hour scheduled successfully');
    } catch (error) {
      toast.error('Failed to schedule office hour');
    }
  };

  const handleCancel = async (sessionId) => {
    try {
      await axios.post(`/api/office-hours/${sessionId}/cancel`);
      setSessions(sessions.filter(s => s._id !== sessionId));
      toast.success('Session cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel session');
    }
  };

  const handleJoinSession = async (session) => {
    try {
      if (user._id === session.instructor._id) {
        await axios.post(`/api/office-hours/${session._id}/start`);
      }
      setActiveSession(session);
    } catch (error) {
      toast.error('Failed to join session');
    }
  };

  const handleLeaveSession = async () => {
    try {
      if (user._id === activeSession.instructor._id) {
        await axios.post(`/api/office-hours/${activeSession._id}/end`);
      }
      setActiveSession(null);
      fetchSessions();
    } catch (error) {
      toast.error('Failed to leave session');
    }
  };

  const handleVideoError = (error) => {
    toast.error(`Video error: ${error}`);
    setActiveSession(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (activeSession) {
    return (
      <div className="h-full">
        <div className="flex justify-between items-center mb-4 p-4 bg-gray-100 rounded-lg">
          <div>
            <h3 className="text-lg font-semibold">{activeSession.topic}</h3>
            <p className="text-sm text-gray-600">
              with {activeSession.instructor.name}
            </p>
          </div>
          <button
            onClick={handleLeaveSession}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Leave Session
          </button>
        </div>
        <VideoRoom 
          roomId={activeSession.meetingData.roomId} 
          onError={handleVideoError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Office Hours</h2>
        {user.role === 'instructor' && (
          <button
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showScheduleForm ? 'Cancel' : 'Schedule Session'}
          </button>
        )}
      </div>

      {showScheduleForm && (
        <form onSubmit={handleSchedule} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Topic</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Session Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="video">Video Call</option>
              <option value="chat">Text Chat</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Schedule
          </button>
        </form>
      )}

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-center text-gray-500">No office hours scheduled</p>
        ) : (
          sessions.map(session => (
            <div
              key={session._id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{session.topic}</h3>
                  <p className="text-sm text-gray-600">
                    with {session.instructor.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {format(parseISO(session.startTime), 'MMM d, yyyy h:mm a')} - 
                    {format(parseISO(session.endTime), 'h:mm a')}
                  </p>
                  {session.description && (
                    <p className="mt-2 text-gray-700">{session.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {session.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleJoinSession(session)}
                        disabled={isBefore(parseISO(session.endTime), new Date())}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        Join
                      </button>
                      {(user._id === session.instructor._id || user._id === session.student._id) && (
                        <button
                          onClick={() => handleCancel(session._id)}
                          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                  {session.status === 'completed' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Completed
                    </span>
                  )}
                  {session.status === 'cancelled' && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OfficeHourScheduler;