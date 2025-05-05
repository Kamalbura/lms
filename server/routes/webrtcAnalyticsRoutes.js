import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import webrtcAnalyticsController from '../controllers/webrtcAnalyticsController.js';

const router = express.Router();

// POST /api/webrtc-analytics - Store WebRTC session analytics
router.post('/', protect, webrtcAnalyticsController.storeAnalytics);

// GET /api/webrtc-analytics/room/:roomId - Get analytics for a specific room
router.get('/room/:roomId', protect, webrtcAnalyticsController.getRoomAnalytics);

// GET /api/webrtc-analytics/user/:userId - Get analytics for a specific user
router.get('/user/:userId', protect, webrtcAnalyticsController.getUserAnalytics);

// GET /api/webrtc-analytics/aggregate - Get aggregate analytics (admin only)
router.get('/aggregate', protect, webrtcAnalyticsController.getAggregateAnalytics);

export default router;