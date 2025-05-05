import mongoose from 'mongoose';

const webRTCAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfficeHour',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  qualityMetrics: {
    averageStats: {
      rtt: Number,         // Round-trip time in ms
      packetLoss: Number,  // Packet loss percentage
      bitrate: Number,     // Bits per second
      frameRate: Number,   // Frames per second
      resolution: {
        width: Number,
        height: Number
      }
    },
    samples: [{
      timestamp: Date,
      rtt: Number,
      packetLoss: Number,
      bitrate: Number,
      frameRate: Number,
      resolution: {
        width: Number,
        height: Number
      }
    }],
    stableQualityPercentage: Number, // Percentage of time with stable quality
    qualityChanges: [{
      timestamp: Date,
      from: String,
      to: String,
      reason: String
    }]
  },
  events: [{
    type: {
      type: String,
      enum: ['join', 'leave', 'quality_change', 'connection_issue', 'screen_share_start', 'screen_share_end']
    },
    timestamp: Date,
    metadata: mongoose.Schema.Types.Mixed
  }]
});

// Calculate session duration before saving
webRTCAnalyticsSchema.pre('save', function(next) {
  if (this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Generate a summary of the analytics
webRTCAnalyticsSchema.methods.generateSummary = function() {
  const qualityScore = this.calculateQualityScore();
  
  return {
    sessionId: this._id,
    userId: this.userId,
    roomId: this.roomId,
    startTime: this.startTime,
    endTime: this.endTime,
    duration: this.duration,
    participantCount: this.participants.length,
    qualityScore,
    qualityMetrics: {
      averageRTT: this.qualityMetrics.averageStats.rtt,
      averagePacketLoss: this.qualityMetrics.averageStats.packetLoss,
      averageBitrate: this.qualityMetrics.averageStats.bitrate,
      stableQualityPercentage: this.qualityMetrics.stableQualityPercentage,
      qualityChangeCount: this.qualityMetrics.qualityChanges.length
    },
    eventSummary: this.summarizeEvents()
  };
};

// Calculate an overall quality score (0-100)
webRTCAnalyticsSchema.methods.calculateQualityScore = function() {
  const stats = this.qualityMetrics.averageStats;
  let score = 100;

  // RTT impact (up to -30 points)
  if (stats.rtt > 500) score -= 30;
  else if (stats.rtt > 300) score -= 20;
  else if (stats.rtt > 150) score -= 10;

  // Packet loss impact (up to -40 points)
  if (stats.packetLoss > 10) score -= 40;
  else if (stats.packetLoss > 5) score -= 25;
  else if (stats.packetLoss > 2) score -= 10;

  // Bitrate impact (up to -20 points)
  if (stats.bitrate < 250000) score -= 20;
  else if (stats.bitrate < 750000) score -= 10;
  else if (stats.bitrate < 1500000) score -= 5;

  // Stability impact (up to -10 points)
  if (this.qualityMetrics.stableQualityPercentage < 70) score -= 10;
  else if (this.qualityMetrics.stableQualityPercentage < 85) score -= 5;

  return Math.max(0, Math.min(100, score));
};

// Summarize session events
webRTCAnalyticsSchema.methods.summarizeEvents = function() {
  const eventCounts = {};
  this.events.forEach(event => {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
  });
  return eventCounts;
};

const WebRTCAnalytics = mongoose.model('WebRTCAnalytics', webRTCAnalyticsSchema);
export default WebRTCAnalytics;