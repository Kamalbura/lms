import WebRTCAnalytics from '../models/WebRTCAnalytics.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('webrtcAnalyticsController');

// Store analytics data for a WebRTC session
export const storeAnalytics = asyncHandler(async (req, res) => {
  const analytics = new WebRTCAnalytics(req.body);
  await analytics.save();

  const summary = analytics.generateSummary();
  res.status(201).json(summary);
});

// Start tracking a new WebRTC session
export const startSession = async (req, res) => {
  try {
    const { userId, roomId, participants } = req.body;
    
    const session = new WebRTCAnalytics({
      userId,
      roomId,
      participants,
      startTime: new Date(),
      events: [{
        type: 'join',
        timestamp: new Date()
      }]
    });

    await session.save();
    logger.info(`Started WebRTC analytics session: ${session._id}`);
    
    res.status(201).json({ sessionId: session._id });
  } catch (error) {
    logger.error('Error starting WebRTC analytics session:', error);
    res.status(500).json({ message: 'Failed to start analytics session' });
  }
};

// Update session with quality metrics
export const updateMetrics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rtt, packetLoss, bitrate, frameRate, resolution } = req.body;

    const session = await WebRTCAnalytics.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const sample = {
      timestamp: new Date(),
      rtt,
      packetLoss,
      bitrate,
      frameRate,
      resolution
    };

    // Add sample to metrics
    session.qualityMetrics.samples.push(sample);

    // Update average stats
    const samples = session.qualityMetrics.samples;
    session.qualityMetrics.averageStats = {
      rtt: samples.reduce((sum, s) => sum + s.rtt, 0) / samples.length,
      packetLoss: samples.reduce((sum, s) => sum + s.packetLoss, 0) / samples.length,
      bitrate: samples.reduce((sum, s) => sum + s.bitrate, 0) / samples.length,
      frameRate: samples.reduce((sum, s) => sum + s.frameRate, 0) / samples.length,
      resolution: resolution
    };

    await session.save();
    logger.debug(`Updated metrics for session ${sessionId}`);
    
    res.status(200).json({ message: 'Metrics updated successfully' });
  } catch (error) {
    logger.error('Error updating WebRTC metrics:', error);
    res.status(500).json({ message: 'Failed to update metrics' });
  }
};

// Record quality change event
export const recordQualityChange = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { from, to, reason } = req.body;

    const session = await WebRTCAnalytics.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.qualityMetrics.qualityChanges.push({
      timestamp: new Date(),
      from,
      to,
      reason
    });

    // Add quality change event
    session.events.push({
      type: 'quality_change',
      timestamp: new Date(),
      metadata: { from, to, reason }
    });

    await session.save();
    logger.info(`Recorded quality change for session ${sessionId}: ${from} -> ${to}`);
    
    res.status(200).json({ message: 'Quality change recorded' });
  } catch (error) {
    logger.error('Error recording quality change:', error);
    res.status(500).json({ message: 'Failed to record quality change' });
  }
};

// End session and calculate final metrics
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await WebRTCAnalytics.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.endTime = new Date();
    
    // Calculate stable quality percentage
    const totalSamples = session.qualityMetrics.samples.length;
    const stableSamples = session.qualityMetrics.samples.filter(sample => 
      sample.rtt < 300 && sample.packetLoss < 5 && sample.bitrate > 750000
    ).length;
    
    session.qualityMetrics.stableQualityPercentage = (stableSamples / totalSamples) * 100;

    // Add end event
    session.events.push({
      type: 'leave',
      timestamp: new Date()
    });

    await session.save();
    
    // Generate session summary
    const summary = session.generateSummary();
    logger.info(`Ended WebRTC session ${sessionId} with quality score: ${summary.qualityScore}`);

    res.status(200).json(summary);
  } catch (error) {
    logger.error('Error ending WebRTC session:', error);
    res.status(500).json({ message: 'Failed to end session' });
  }
};

// Get session analytics
export const getSessionAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await WebRTCAnalytics.findById(sessionId)
      .populate('userId', 'name email')
      .populate('roomId', 'title');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const summary = session.generateSummary();
    res.status(200).json(summary);
  } catch (error) {
    logger.error('Error fetching session analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

// Get analytics for a specific office hours session
export const getRoomAnalytics = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  const analytics = await WebRTCAnalytics.find({ roomId })
    .populate('userId', 'name email')
    .populate('participants', 'name email')
    .sort('-startTime');

  const roomSummary = {
    totalSessions: analytics.length,
    totalParticipants: new Set(analytics.flatMap(a => a.participants.map(p => p._id.toString()))).size,
    totalDuration: analytics.reduce((sum, a) => sum + a.duration, 0),
    averageQualityScore: analytics.reduce((sum, a) => sum + a.calculateQualityScore(), 0) / analytics.length,
    sessions: analytics.map(a => a.generateSummary())
  };

  res.json(roomSummary);
});

// Get analytics for a specific user's sessions
export const getUserAnalytics = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  const query = { userId };
  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = new Date(startDate);
    if (endDate) query.startTime.$lte = new Date(endDate);
  }

  const analytics = await WebRTCAnalytics.find(query)
    .populate('roomId', 'title description')
    .sort('-startTime');

  const userSummary = {
    totalSessions: analytics.length,
    totalDuration: analytics.reduce((sum, a) => sum + a.duration, 0),
    averageQualityScore: analytics.reduce((sum, a) => sum + a.calculateQualityScore(), 0) / analytics.length,
    qualityDistribution: analytics.reduce((dist, a) => {
      const score = a.calculateQualityScore();
      if (score >= 90) dist.excellent++;
      else if (score >= 75) dist.good++;
      else if (score >= 60) dist.fair++;
      else dist.poor++;
      return dist;
    }, { excellent: 0, good: 0, fair: 0, poor: 0 }),
    sessions: analytics.map(a => ({
      ...a.generateSummary(),
      room: a.roomId
    }))
  };

  res.json(userSummary);
});

// Get aggregate analytics for all sessions
export const getAggregateAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = new Date(startDate);
    if (endDate) query.startTime.$lte = new Date(endDate);
  }

  const analytics = await WebRTCAnalytics.find(query)
    .populate('userId', 'name email')
    .populate('roomId', 'title');

  const aggregateSummary = {
    totalSessions: analytics.length,
    totalUsers: new Set(analytics.map(a => a.userId._id.toString())).size,
    totalDuration: analytics.reduce((sum, a) => sum + a.duration, 0),
    averageQualityScore: analytics.reduce((sum, a) => sum + a.calculateQualityScore(), 0) / analytics.length,
    qualityDistribution: analytics.reduce((dist, a) => {
      const score = a.calculateQualityScore();
      if (score >= 90) dist.excellent++;
      else if (score >= 75) dist.good++;
      else if (score >= 60) dist.fair++;
      else dist.poor++;
      return dist;
    }, { excellent: 0, good: 0, fair: 0, poor: 0 }),
    networkStats: {
      averageRTT: analytics.reduce((sum, a) => sum + a.qualityMetrics.averageStats.rtt, 0) / analytics.length,
      averagePacketLoss: analytics.reduce((sum, a) => sum + a.qualityMetrics.averageStats.packetLoss, 0) / analytics.length,
      averageBitrate: analytics.reduce((sum, a) => sum + a.qualityMetrics.averageStats.bitrate, 0) / analytics.length
    },
    topIssues: analyzeCommonIssues(analytics)
  };

  res.json(aggregateSummary);
});

// Helper function to analyze common issues across sessions
function analyzeCommonIssues(analytics) {
  const issues = [];

  // Analyze network issues
  const highRTTSessions = analytics.filter(a => a.qualityMetrics.averageStats.rtt > 300).length;
  const highPacketLossSessions = analytics.filter(a => a.qualityMetrics.averageStats.packetLoss > 5).length;
  const lowBitrateSessions = analytics.filter(a => a.qualityMetrics.averageStats.bitrate < 500000).length;

  if (highRTTSessions > analytics.length * 0.2) {
    issues.push({
      type: 'network_latency',
      description: 'High network latency in more than 20% of sessions',
      affectedSessions: highRTTSessions,
      percentage: Math.round((highRTTSessions / analytics.length) * 100)
    });
  }

  if (highPacketLossSessions > analytics.length * 0.15) {
    issues.push({
      type: 'packet_loss',
      description: 'Significant packet loss in more than 15% of sessions',
      affectedSessions: highPacketLossSessions,
      percentage: Math.round((highPacketLossSessions / analytics.length) * 100)
    });
  }

  if (lowBitrateSessions > analytics.length * 0.25) {
    issues.push({
      type: 'low_bandwidth',
      description: 'Low bandwidth in more than 25% of sessions',
      affectedSessions: lowBitrateSessions,
      percentage: Math.round((lowBitrateSessions / analytics.length) * 100)
    });
  }

  // Analyze quality stability
  const unstableSessions = analytics.filter(a => a.qualityMetrics.stableQualityPercentage < 70).length;
  if (unstableSessions > analytics.length * 0.3) {
    issues.push({
      type: 'quality_stability',
      description: 'Unstable connection quality in more than 30% of sessions',
      affectedSessions: unstableSessions,
      percentage: Math.round((unstableSessions / analytics.length) * 100)
    });
  }

  return issues;
}

export default {
  storeAnalytics,
  startSession,
  updateMetrics,
  recordQualityChange,
  endSession,
  getSessionAnalytics,
  getRoomAnalytics,
  getUserAnalytics,
  getAggregateAnalytics
};