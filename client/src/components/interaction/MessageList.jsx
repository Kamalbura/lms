import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import ImageWithFallback from '../ImageWithFallback';
import { formatDistanceToNow } from 'date-fns';

const MessageList = ({ messages, onMarkAsRead }) => {
  const { user } = useSelector(state => state.auth);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Mark messages as read when they appear in view
  useEffect(() => {
    if (!onMarkAsRead) return;
    
    const unreadMessages = messages.filter(msg => 
      msg.senderId._id !== user._id && 
      !msg.readBy.some(read => read.userId === user._id)
    );
    
    if (unreadMessages.length > 0) {
      onMarkAsRead(unreadMessages.map(msg => msg._id));
    }
  }, [messages, user._id, onMarkAsRead]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const renderAttachment = (attachment) => {
    const isImage = attachment.match(/\.(jpeg|jpg|gif|png)$/i);
    
    if (isImage) {
      return (
        <div className="max-w-xs mt-1">
          <ImageWithFallback 
            src={attachment} 
            alt="Attachment" 
            className="rounded border max-h-40 object-contain" 
          />
        </div>
      );
    } else {
      // For non-image files, show a download link
      const fileName = attachment.split('/').pop();
      return (
        <a 
          href={attachment} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center mt-1 p-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm truncate">{fileName}</span>
        </a>
      );
    }
  };
  
  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = null;
    let currentMessages = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        if (currentMessages.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentMessages
          });
        }
        
        currentDate = messageDate;
        currentMessages = [message];
      } else {
        currentMessages.push(message);
      }
    });
    
    // Add the last group
    if (currentMessages.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentMessages
      });
    }
    
    return groups;
  };
  
  const getDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };
  
  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex-1 p-4 overflow-y-auto" ref={containerRef}>
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          <div className="flex justify-center mb-4">
            <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
              {getDateHeader(group.date)}
            </div>
          </div>
          
          {group.messages.map((message, index) => {
            const isSender = message.senderId._id === user._id;
            const showAvatar = index === 0 || group.messages[index - 1].senderId._id !== message.senderId._id;
            
            return (
              <div key={message._id} className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
                {!isSender && showAvatar && (
                  <div className="flex-shrink-0 mr-2">
                    <ImageWithFallback 
                      src={message.senderId.profileImage}
                      alt={message.senderId.name}
                      className="w-8 h-8 rounded-full object-cover"
                      fallbackSrc="https://via.placeholder.com/40?text=User"
                    />
                  </div>
                )}
                
                <div className={`max-w-[70%] ${!isSender && !showAvatar ? 'ml-10' : ''}`}>
                  {showAvatar && (
                    <div className={`text-xs text-gray-500 mb-1 ${isSender ? 'text-right' : ''}`}>
                      {isSender ? 'You' : message.senderId.name}
                    </div>
                  )}
                  
                  <div className={`rounded-lg p-3 ${isSender ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                    {message.content && <div>{message.content}</div>}
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, i) => (
                          <div key={i}>
                            {renderAttachment(attachment)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-gray-400 mt-1 ${isSender ? 'text-right' : ''}`}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    
                    {isSender && message.readBy && message.readBy.length > 1 && (
                      <span className="ml-1 text-green-500">Read</span>
                    )}
                  </div>
                </div>
                
                {isSender && showAvatar && (
                  <div className="flex-shrink-0 ml-2">
                    <ImageWithFallback 
                      src={message.senderId.profileImage}
                      alt={message.senderId.name}
                      className="w-8 h-8 rounded-full object-cover"
                      fallbackSrc="https://via.placeholder.com/40?text=You"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
