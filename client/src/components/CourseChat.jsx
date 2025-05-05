import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import MessageList from './interaction/MessageList';
import MessageInput from './interaction/MessageInput';
import toast from 'react-hot-toast';

const CourseChat = ({ courseId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, user } = useSelector(state => state.auth);
  const { socket } = useSelector(state => state.interaction);

  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/messages/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load messages');
        toast.error('Failed to load chat messages');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchMessages();
    }
  }, [courseId, token]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    // Join course chat room
    socket.emit('join:course', { courseId });

    // Listen for new messages
    socket.on('message:course', (message) => {
      if (message.courseId === courseId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Listen for typing indicators
    socket.on('typing:start:course', ({ userId, courseId: typingCourseId }) => {
      if (typingCourseId === courseId && userId !== user._id) {
        // You could implement typing indicator UI here
      }
    });

    socket.on('typing:stop:course', ({ userId, courseId: typingCourseId }) => {
      if (typingCourseId === courseId && userId !== user._id) {
        // You could remove typing indicator UI here
      }
    });

    // Cleanup function
    return () => {
      socket.off('message:course');
      socket.off('typing:start:course');
      socket.off('typing:stop:course');
      socket.emit('leave:course', { courseId });
    };
  }, [socket, courseId, user._id]);

  // Handle marking messages as read
  const handleMarkAsRead = async (messageIds) => {
    try {
      await axios.post('/api/messages/mark-read', 
        { messageIds }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/course/${courseId}`,
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // If socket isn't connected, add message immediately to the UI
      if (!socket || !socket.connected) {
        setMessages(prev => [...prev, data]);
      }
      
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
      return false;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <h3 className="font-medium">Course Chat</h3>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <MessageList 
              messages={messages} 
              onMarkAsRead={handleMarkAsRead} 
            />
          </div>
          <div className="border-t">
            <MessageInput 
              onSendMessage={handleSendMessage} 
              placeholder="Type a message to everyone in this course..."
              courseId={courseId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseChat;
