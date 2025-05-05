import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB, { closeConnection } from './config/db.js';
import logger from './utils/logger.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import enrollRoutes from './routes/enrollRoutes.js';
import configRoutes from './routes/configRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import officeHourRoutes from './routes/officeHourRoutes.js';
import { protect, restrictTo } from './middleware/authMiddleware.js';
import configureSocketServer from './socketServer.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import http from 'http';
import { Server } from 'socket.io';
import WebRTCSignalingServer from './utils/webrtc.js';

// Initialize environment variables
dotenv.config();

// Connect to MongoDB
const connection = await connectDB();

const app = express();

// Create HTTP server and Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize WebRTC signaling server
const webRTCServer = new WebRTCSignalingServer(server);

// Socket.io connection handling
io.on('connection', socket => {
  logger.info(`User connected: ${socket.id}`);
  
  // Join course room for chat
  socket.on('join:course', ({ courseId }) => {
    socket.join(`course:${courseId}`);
    logger.info(`User ${socket.id} joined course chat: ${courseId}`);
  });
  
  // Send message to course chat
  socket.on('message:course', (message) => {
    io.to(`course:${message.courseId}`).emit('message:course', message);
  });
  
  // Typing indicators
  socket.on('typing:start:course', (data) => {
    socket.to(`course:${data.courseId}`).emit('typing:start:course', data);
  });
  
  socket.on('typing:stop:course', (data) => {
    socket.to(`course:${data.courseId}`).emit('typing:stop:course', data);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Enhanced Middleware Configuration
app.use(helmet());

// Enable CORS with various options
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true,
  credentials: true
}));

// Body parser with size limits
app.use(express.json({ limit: '10kb', extended: false }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Compress responses
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Request logging
app.use(logger.requestLogger);

// Static file serving for uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enroll', enrollRoutes);
app.use('/api/config', configRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/officehours', officeHourRoutes);

// Health check and test routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webrtc: {
      activeRooms: webRTCServer.getActiveRoomCount()
    }
  });
});

// Protected route examples
app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/api/admin', protect, restrictTo('admin'), (req, res) => {
  res.json({ message: 'Admin access granted', user: req.user });
});

app.get('/api/instructor', protect, restrictTo('instructor', 'admin'), (req, res) => {
  res.json({ message: 'Instructor access granted', user: req.user });
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
} else {
  // Root route (only used in development)
  app.get('/', (req, res) => {
    res.json({ message: 'ProLearn API is running 🚀' });
  });
}

// 404 Error for unmatched routes - must be after all defined routes
app.use(notFound);

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  if (connection) {
    await closeConnection();
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  if (connection) {
    await closeConnection();
  }
  
  process.exit(0);
});

export default app;
