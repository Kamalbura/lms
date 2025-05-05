import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const MessageInput = ({ onSendMessage, placeholder = "Type a message...", threadId, receiverId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  
  const { socket } = useSelector(state => state.interaction);
  const typingTimeoutRef = useRef(null);
  
  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Handle typing indicator
    if (socket && (threadId || receiverId)) {
      if (!isTyping) {
        setIsTyping(true);
        
        if (threadId) {
          socket.emit('typing:start', { threadId });
        } else if (receiverId) {
          socket.emit('typing:start', { receiverId });
        }
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        
        if (threadId) {
          socket.emit('typing:stop', { threadId });
        } else if (receiverId) {
          socket.emit('typing:stop', { receiverId });
        }
      }, 2000);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage || attachments.length > 0) {
      onSendMessage({ content: trimmedMessage, attachments });
      setMessage('');
      setAttachments([]);
      
      // Stop typing indicator
      if (isTyping && socket) {
        setIsTyping(false);
        
        if (threadId) {
          socket.emit('typing:stop', { threadId });
        } else if (receiverId) {
          socket.emit('typing:stop', { receiverId });
        }
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit total attachments to 5
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 attachments allowed');
      return;
    }
    
    // Check file size (max 5MB per file)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Files exceeding 5MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Create preview and prepare for upload
    const newAttachments = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      type: file.type
    }));
    
    setAttachments([...attachments, ...newAttachments]);
  };
  
  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newAttachments[index].preview);
    
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  return (
    <div className="border-t p-3">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-gray-100 rounded p-2 flex items-center">
              {attachment.type.startsWith('image/') ? (
                <img src={attachment.preview} alt="" className="h-10 w-10 object-cover rounded mr-2" />
              ) : (
                <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center mr-2">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <span className="text-sm truncate max-w-[100px]">{attachment.name}</span>
              <button 
                onClick={() => removeAttachment(index)}
                className="ml-1 text-gray-500 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end rounded-lg border bg-white">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-grow min-h-[40px] max-h-[120px] p-2 rounded-lg resize-y focus:outline-none"
        />
        
        <div className="flex items-center p-2">
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
          </button>
          
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!message.trim() && attachments.length === 0}
            className={`ml-2 p-2 rounded-full ${
              !message.trim() && attachments.length === 0 
                ? 'bg-gray-200 text-gray-400' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
