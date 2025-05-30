import { Server } from 'socket.io';
import logger from './logger.js';

// ICE server configuration for WebRTC
const iceServers = [
  {
    urls: [
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302'
    ]
  }
];

// Add primary TURN server if configured
if (process.env.TURN_SERVER_URL) {
  iceServers.push({
    urls: process.env.TURN_SERVER_URL,
    username: process.env.TURN_SERVER_USERNAME,
    credential: process.env.TURN_SERVER_CREDENTIAL
  });
  
  logger.info('Primary TURN server configured for WebRTC');
}

// Add backup TURN server if configured and enabled
if (process.env.USE_BACKUP_TURN_SERVER === 'true' && 
    process.env.BACKUP_TURN_SERVER_URL) {
  iceServers.push({
    urls: process.env.BACKUP_TURN_SERVER_URL,
    username: process.env.BACKUP_TURN_SERVER_USERNAME,
    credential: process.env.BACKUP_TURN_SERVER_CREDENTIAL
  });
  
  logger.info('Backup TURN server configured for WebRTC');
}

// Connection constraints
const connectionConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

// Video quality settings
const videoQualitySettings = {
  standard: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 30 }
  },
  high: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  },
  fullHD: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 }
  }
};

// Screen sharing settings
const screenSharingSettings = {
  video: {
    cursor: 'always',
    displaySurface: 'monitor',
    logicalSurface: true,
    width: { max: 1920 },
    height: { max: 1080 },
    frameRate: { max: 30 }
  },
  audio: false
};

// Connection quality thresholds (in milliseconds)
const connectionQuality = {
  good: 100,    // RTT < 100ms
  medium: 300,  // RTT < 300ms
  poor: 500     // RTT >= 500ms
};

const getConnectionQuality = (rtt) => {
  if (rtt < connectionQuality.good) return 'good';
  if (rtt < connectionQuality.medium) return 'medium';
  if (rtt < connectionQuality.poor) return 'poor';
  return 'critical';
};

// Network stats collection
const getConnectionStats = async (peerConnection) => {
  try {
    const stats = await peerConnection.getStats();
    let rtt = 0;
    let packetLoss = 0;
    let bitrate = 0;
    
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime * 1000; // Convert to ms
      }
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        packetLoss = report.packetsLost;
        // Calculate bitrate
        if (report.bytesReceived && report.timestamp) {
          const timeDiff = report.timestamp - (stats.timestamp || 0);
          bitrate = (8 * report.bytesReceived) / timeDiff; // bits per second
        }
      }
    });

    return {
      quality: getConnectionQuality(rtt),
      rtt,
      packetLoss,
      bitrate
    };
  } catch (error) {
    logger.error('Error getting connection stats:', error);
    return null;
  }
};

// Error handling for common WebRTC issues
const handleRTCError = (error) => {
  let errorMessage = 'WebRTC Error: ';
  
  switch (error.name) {
    case 'NotAllowedError':
      errorMessage += 'Permission denied for media devices';
      break;
    case 'NotFoundError':
      errorMessage += 'No media devices found';
      break;
    case 'NotReadableError':
      errorMessage += 'Media device is in use';
      break;
    case 'OverconstrainedError':
      errorMessage += 'Media device constraints not satisfied';
      break;
    case 'SecurityError':
      errorMessage += 'Media devices access not allowed';
      break;
    case 'TypeError':
      errorMessage += 'Invalid constraints or parameters';
      break;
    default:
      errorMessage += error.message || 'Unknown error occurred';
  }

  logger.error(errorMessage, error);
  return {
    error: true,
    message: errorMessage,
    details: error
  };
};

class WebRTCSignalingServer {
  constructor(server) {
    this.io = new Server(server, {
      path: '/webrtc',
      cors: {
        origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : true,
        methods: ['GET', 'POST'],
        credentials: true
      },
      // Add reconnection parameters
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.rooms = new Map();
    // Track disconnected users to handle reconnections
    this.disconnectedUsers = new Map(); // {userId: {roomId, timestamp}}
    
    // Setup automatic cleanup of disconnected users after 5 minutes
    setInterval(this.cleanupDisconnectedUsers.bind(this), 60000); // Run every minute
    
    this.setupSocketHandlers();
  }
  
  // Clean up disconnected users that have been gone for more than 5 minutes
  cleanupDisconnectedUsers() {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    
    this.disconnectedUsers.forEach((data, userId) => {
      if (now - data.timestamp > CLEANUP_THRESHOLD) {
        logger.info(`Removing disconnected user ${userId} from recovery list after timeout`);
        this.disconnectedUsers.delete(userId);
      }
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`WebRTC client connected: ${socket.id}`);

      // Join room
      socket.on('join-room', ({ roomId, userId, userType }) => {
        this.handleJoinRoom(socket, roomId, userId, userType);
      });

      // Leave room
      socket.on('leave-room', ({ roomId }) => {
        this.handleLeaveRoom(socket, roomId);
      });

      // Handle WebRTC signaling
      socket.on('signal', ({ to, signal, from }) => {
        this.handleSignal(to, signal, from);
      });

      // Handle ICE candidates
      socket.on('ice-candidate', ({ to, candidate }) => {
        this.handleIceCandidate(to, candidate);
      });

      // Handle streaming controls
      socket.on('stream-control', ({ roomId, action, userId }) => {
        this.handleStreamControl(roomId, action, userId);
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleJoinRoom(socket, roomId, userId, userType) {
    try {
      // Create room if it doesn't exist
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }

      // Check if user is reconnecting from temporary disconnect
      const isReconnecting = this.disconnectedUsers.has(userId) && 
                            this.disconnectedUsers.get(userId).roomId === roomId;

      // Remove from disconnected users list if reconnecting
      if (isReconnecting) {
        this.disconnectedUsers.delete(userId);
        logger.info(`User ${userId} is reconnecting to room ${roomId}`);
      }
      
      // Add user to room
      socket.join(roomId);
      this.rooms.get(roomId).add({
        socketId: socket.id,
        userId,
        userType,
        joinedAt: new Date(),
        reconnected: isReconnecting
      });

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        userId,
        userType,
        socketId: socket.id,
        isReconnecting
      });

      // Send list of existing users to new participant
      const participants = Array.from(this.rooms.get(roomId))
        .filter(p => p.socketId !== socket.id);
      
      socket.emit('room-users', participants);

      logger.info(`User ${userId} joined room ${roomId}${isReconnecting ? ' (reconnected)' : ''}`);
    } catch (error) {
      logger.error(`Error joining room: ${error.message}`);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  handleLeaveRoom(socket, roomId) {
    try {
      if (this.rooms.has(roomId)) {
        const room = this.rooms.get(roomId);
        const user = Array.from(room).find(u => u.socketId === socket.id);

        if (user) {
          room.delete(user);
          socket.to(roomId).emit('user-left', {
            userId: user.userId,
            socketId: socket.id
          });

          // Remove room if empty
          if (room.size === 0) {
            this.rooms.delete(roomId);
          }
        }

        socket.leave(roomId);
        logger.info(`User ${user?.userId} left room ${roomId}`);
      }
    } catch (error) {
      logger.error(`Error leaving room: ${error.message}`);
    }
  }

  handleSignal(to, signal, from) {
    this.io.to(to).emit('signal', { from, signal });
  }

  handleIceCandidate(to, candidate) {
    this.io.to(to).emit('ice-candidate', { candidate });
  }

  handleStreamControl(roomId, action, userId) {
    this.io.to(roomId).emit('stream-control', { action, userId });
  }

  handleDisconnect(socket) {
    try {
      // Find and remove user from all rooms
      this.rooms.forEach((users, roomId) => {
        const user = Array.from(users).find(u => u.socketId === socket.id);
        if (user) {
          // Store the disconnected user info for potential reconnection
          this.disconnectedUsers.set(user.userId, {
            roomId,
            timestamp: Date.now()
          });
          
          // Remove from room but notify others this is potentially temporary
          users.delete(user);
          socket.to(roomId).emit('user-disconnected', {
            userId: user.userId,
            socketId: socket.id,
            temporary: true
          });

          logger.info(`User ${user.userId} temporarily disconnected from room ${roomId}`);
          
          // Only remove room if it's empty
          if (users.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      });

      logger.info(`WebRTC client disconnected: ${socket.id}`);
    } catch (error) {
      logger.error(`Error handling disconnect: ${error.message}`);
    }
  }

  // Get room participants
  getRoomParticipants(roomId) {
    return Array.from(this.rooms.get(roomId) || []);
  }

  // Check if room exists
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  // Get total number of active rooms
  getActiveRoomCount() {
    return this.rooms.size;
  }
}

export {
  iceServers,
  connectionConstraints,
  videoQualitySettings,
  screenSharingSettings,
  connectionQuality,
  getConnectionQuality,
  getConnectionStats,
  handleRTCError
};

export default WebRTCSignalingServer;