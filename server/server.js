import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import configureSocketServer from './socketServer.js';
import WebRTCSignalingServer from './utils/webrtc.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import enrollRoutes from './routes/enrollRoutes.js';
import configRoutes from './routes/configRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import officeHourRoutes from './routes/officeHourRoutes.js';
import { protect, restrictTo } from './middleware/authMiddleware.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Initialize environment variables
dotenv.config();

// Connect to MongoDB
const connectionPromise = connectDB();

const app = express();

// Enhanced Middleware Configuration
app.use(helmet());

// Enable CORS for client
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || true 
    : true,
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

// Static file serving for uploads (in Vercel, these will need to be stored elsewhere)
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

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Protected route examples
app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/api/admin', protect, restrictTo('admin'), (req, res) => {
  res.json({ message: 'Admin access granted', user: req.user });
});

// 404 Error for unmatched routes
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Export app for serverless deployment
export default app;

// Only listen on a port if not in serverless environment
if (process.env.NODE_ENV !== 'vercel') {
  const PORT = process.env.PORT || 5000;
  
  // Create HTTP server using Express app
  const server = http.createServer(app);
  
  // Set up Socket.IO with the HTTP server
  const io = configureSocketServer(server);
  
  // Set up WebRTC signaling server
  const webRTCServer = new WebRTCSignalingServer(server);
  
  // Start listening on the port with HTTP server (instead of Express app)
  server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info('WebSocket server initialized');
  });
  
  // Handle graceful shutdown
  const handleShutdown = async () => {
    logger.info('Shutting down server...');
    server.close(() => {
      logger.info('HTTP/WebSocket server closed');
      process.exit(0);
    });
  };
  
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}
