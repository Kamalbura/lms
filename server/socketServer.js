import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Message from './models/Message.js';
import Thread from './models/Thread.js';
import logger from './utils/logger.js';

// Map to track online users by userId
const onlineUsers = new Map();
// Map to track which rooms a user is in
const userRooms = new Map();
// Track active rooms and their participants
const rooms = new Map();

const configureSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Add reconnection parameters
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Add user data to socket for use in event handlers
      socket.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      logger.error(`Socket authentication failed: ${error.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`User connected: ${userId} (${socket.user.name})`);

    // Add user to online users map
    onlineUsers.set(userId, {
      socketId: socket.id,
      user: socket.user,
      lastActive: new Date()
    });
    userRooms.set(socket.id, new Set());

    // Broadcast updated online users list
    io.emit('users:online', Array.from(onlineUsers.keys()));

    // Join a room for a course
    socket.on('room:join', ({ roomType, roomId }) => {
      try {
        const roomName = `${roomType}-${roomId}`;
        socket.join(roomName);
        
        // Track rooms for this user
        const rooms = userRooms.get(socket.id);
        if (rooms) rooms.add(roomName);
        
        logger.debug(`User ${userId} joined room: ${roomName}`);
        
        // Notify room members
        socket.to(roomName).emit('room:userJoined', {
          user: {
            _id: socket.user._id,
            name: socket.user.name
          },
          roomName
        });
      } catch (error) {
        logger.error(`Error joining room: ${error.message}`);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave a room
    socket.on('room:leave', ({ roomType, roomId }) => {
      try {
        const roomName = `${roomType}-${roomId}`;
        socket.leave(roomName);
        
        // Remove room from user's tracked rooms
        const rooms = userRooms.get(socket.id);
        if (rooms) rooms.delete(roomName);
        
        logger.debug(`User ${userId} left room: ${roomName}`);
        
        // Notify room members
        socket.to(roomName).emit('room:userLeft', {
          user: {
            _id: socket.user._id,
            name: socket.user.name
          },
          roomName
        });
      } catch (error) {
        logger.error(`Error leaving room: ${error.message}`);
      }
    });
    
    // Handle thread messages
    socket.on('thread:message', async (messageData) => {
      try {
        const { threadId, content, attachments = [] } = messageData;
        
        if (!threadId || !content) {
          return socket.emit('error', { message: 'ThreadId and content are required' });
        }

        // Get the thread
        const thread = await Thread.findById(threadId);
        if (!thread) {
          return socket.emit('error', { message: 'Thread not found' });
        }

        // Create and save the message
        const message = new Message({
          threadId,
          senderId: userId,
          content,
          attachments,
          readBy: [{ userId }],  // Sender has read it
          isDM: false
        });
        
        await message.save();
        
        // Update thread's lastActivityAt and messageCount
        await Thread.findByIdAndUpdate(threadId, {
          lastActivityAt: new Date(),
          $inc: { messageCount: 1 }
        });

        // Populate sender info
        await message.populate('senderId', 'name email profileImage');
        
        // Broadcast to thread room
        io.to(`thread-${threadId}`).emit('message:new', message);
        
        // Send notification to course room (excluding those already in thread room)
        socket.to(`course-${thread.courseId}`).emit('thread:activity', {
          threadId,
          message: {
            _id: message._id,
            content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
            sender: message.senderId,
            createdAt: message.createdAt
          }
        });

        logger.debug(`Thread message sent to ${threadId} by ${userId}`);
      } catch (error) {
        logger.error(`Error sending thread message: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle direct messages
    socket.on('dm:message', async (messageData) => {
      try {
        const { receiverId, content, attachments = [] } = messageData;
        
        if (!receiverId || !content) {
          return socket.emit('error', { message: 'ReceiverId and content are required' });
        }

        // Validate receiver
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          return socket.emit('error', { message: 'Receiver not found' });
        }

        // Create and save the message
        const message = new Message({
          senderId: userId,
          receiverId,
          content,
          attachments,
          readBy: [{ userId }],  // Sender has read it
          isDM: true
        });
        
        await message.save();

        // Populate sender info
        await message.populate('senderId', 'name email profileImage');
        
        // Send to sender
        socket.emit('dm:message', message);
        
        // Check if receiver is online and send them the message
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('dm:message', message);
        }
        
        // Send notification of unread message
        io.to(receiverSocket?.socketId || '').emit('dm:notification', {
          from: {
            _id: socket.user._id,
            name: socket.user.name
          },
          messageId: message._id,
          preview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });

        logger.debug(`DM sent from ${userId} to ${receiverId}`);
      } catch (error) {
        logger.error(`Error sending DM: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('message:read', async ({ messageIds }) => {
      try {
        if (!messageIds || !messageIds.length) return;
        
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: { userId, readAt: new Date() } } }
        );
        
        logger.debug(`${messageIds.length} messages marked as read by ${userId}`);
        
        // For DMs, notify the sender that messages were read
        const messages = await Message.find({ _id: { $in: messageIds }, isDM: true });
        
        // Group by sender
        const senderNotifications = messages.reduce((acc, message) => {
          const senderId = message.senderId.toString();
          if (senderId !== userId) { // Don't notify self
            if (!acc[senderId]) acc[senderId] = [];
            acc[senderId].push(message._id);
          }
          return acc;
        }, {});
        
        // Send read receipts to each sender
        Object.entries(senderNotifications).forEach(([senderId, ids]) => {
          const senderSocket = onlineUsers.get(senderId);
          if (senderSocket) {
            io.to(senderSocket.socketId).emit('message:read', {
              reader: { _id: userId, name: socket.user.name },
              messageIds: ids
            });
          }
        });
      } catch (error) {
        logger.error(`Error marking messages as read: ${error.message}`);
      }
    });
    
    // Handle typing indicators
    socket.on('typing:start', ({ threadId, receiverId }) => {
      try {
        if (threadId) {
          // Thread typing
          socket.to(`thread-${threadId}`).emit('typing:update', {
            threadId,
            user: {
              _id: socket.user._id,
              name: socket.user.name
            },
            isTyping: true
          });
        } else if (receiverId) {
          // DM typing
          const receiverSocket = onlineUsers.get(receiverId);
          if (receiverSocket) {
            io.to(receiverSocket.socketId).emit('typing:update', {
              user: {
                _id: socket.user._id,
                name: socket.user.name
              },
              isTyping: true
            });
          }
        }
      } catch (error) {
        logger.error(`Error with typing indicator: ${error.message}`);
      }
    });
    
    socket.on('typing:stop', ({ threadId, receiverId }) => {
      try {
        if (threadId) {
          // Thread typing
          socket.to(`thread-${threadId}`).emit('typing:update', {
            threadId,
            user: {
              _id: socket.user._id,
              name: socket.user.name
            },
            isTyping: false
          });
        } else if (receiverId) {
          // DM typing
          const receiverSocket = onlineUsers.get(receiverId);
          if (receiverSocket) {
            io.to(receiverSocket.socketId).emit('typing:update', {
              user: {
                _id: socket.user._id,
                name: socket.user.name
              },
              isTyping: false
            });
          }
        }
      } catch (error) {
        logger.error(`Error with typing indicator: ${error.message}`);
      }
    });

    // WebRTC Signaling
    socket.on('join:room', ({ roomId, userId, userName }) => {
      // Create room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }

      // Check if user is rejoining (reconnection scenario)
      const isRejoining = Array.from(rooms.get(roomId)).some(u => u.id === userId);
      
      // Remove any previous instances of this user in the room
      if (isRejoining) {
        const usersSet = rooms.get(roomId);
        const oldUserEntry = Array.from(usersSet).find(u => u.id === userId);
        if (oldUserEntry) {
          usersSet.delete(oldUserEntry);
          logger.info(`User ${userId} (${userName}) is reconnecting to room ${roomId}`);
        }
      }

      // Add user to room with current socket id
      rooms.get(roomId).add({
        id: userId,
        name: userName,
        socketId: socket.id,
        joinedAt: new Date()
      });

      // Join socket room
      socket.join(roomId);

      // Get list of users in room
      const users = Array.from(rooms.get(roomId));

      // Notify others in room
      socket.to(roomId).emit('user:joined', {
        userId,
        userName,
        socketId: socket.id,
        rejoining: isRejoining
      });

      // Send list of users to new participant
      socket.emit('room:users', users);
    });

    // Handle WebRTC signals
    socket.on('signal', ({ to, from, signal }) => {
      io.to(to).emit('signal', {
        from,
        signal
      });
    });

    // Handle screen sharing
    socket.on('screen:share:start', ({ roomId, userId }) => {
      socket.to(roomId).emit('screen:share:started', { userId });
    });

    socket.on('screen:share:stop', ({ roomId }) => {
      socket.to(roomId).emit('screen:share:stopped');
    });

    // Handle raise hand
    socket.on('hand:raise', ({ roomId, userId, userName }) => {
      socket.to(roomId).emit('hand:raised', { userId, userName });
    });

    socket.on('hand:lower', ({ roomId, userId }) => {
      socket.to(roomId).emit('hand:lowered', { userId });
    });

    // Meeting controls
    socket.on('mic:toggle', ({ roomId, userId, status }) => {
      socket.to(roomId).emit('mic:toggled', { userId, status });
    });

    socket.on('camera:toggle', ({ roomId, userId, status }) => {
      socket.to(roomId).emit('camera:toggled', { userId, status });
    });

    // Recording signals
    socket.on('recording:start', ({ roomId, userId }) => {
      socket.to(roomId).emit('recording:started', { userId });
    });

    socket.on('recording:stop', ({ roomId }) => {
      socket.to(roomId).emit('recording:stopped');
    });

    // Leave room explicitly
    socket.on('leave:room', ({ roomId, userId }) => {
      if (rooms.has(roomId)) {
        const users = rooms.get(roomId);
        const user = Array.from(users).find(u => u.id === userId);
        if (user) {
          users.delete(user);
          socket.leave(roomId);
          socket.to(roomId).emit('user:left', user);

          // Remove room if empty
          if (users.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
    });

    // Chat within video conference
    socket.on('conference:message', ({ roomId, message }) => {
      io.to(roomId).emit('conference:message', message);
    });

    // Connection quality updates
    socket.on('connection:quality', ({ roomId, userId, status }) => {
      socket.to(roomId).emit('connection:quality:update', { userId, status });
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
      socket.emit('error', { message: 'Internal server error' });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId} (${socket.user.name})`);
      
      // Remove from online users
      onlineUsers.delete(userId);
      
      // Get rooms user was in
      const userRoomsSet = userRooms.get(socket.id) || new Set();
      
      // Notify all rooms that the user left
      userRoomsSet.forEach(roomName => {
        socket.to(roomName).emit('room:userLeft', {
          user: {
            _id: socket.user._id,
            name: socket.user.name
          },
          roomName
        });
      });
      
      // Clean up user rooms
      userRooms.delete(socket.id);
      
      // Remove user from all WebRTC rooms
      rooms.forEach((users, roomId) => {
        const user = Array.from(users).find(u => u.socketId === socket.id);
        if (user) {
          users.delete(user);
          socket.to(roomId).emit('user:left', user);

          // Remove room if empty
          if (users.size === 0) {
            rooms.delete(roomId);
          }
        }
      });

      // Broadcast updated online users list
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
  
  // Return io instance for use elsewhere
  return io;
};

export default configureSocketServer;
