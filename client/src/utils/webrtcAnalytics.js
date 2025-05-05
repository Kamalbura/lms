import axios from 'axios';

class WebRTCAnalytics {
  constructor() {
    this.sessionData = {
      startTime: null,
      endTime: null,
      qualityHistory: [],
      events: [],
      networkStats: [],
      participants: new Set(),
      interactions: {
        micToggleCount: 0,
        cameraToggleCount: 0,
        screenShareCount: 0,
        handRaiseCount: 0,
        messageCount: 0
      }
    };
  }

  startSession(roomId, userId) {
    this.sessionData.startTime = new Date();
    this.sessionData.roomId = roomId;
    this.sessionData.userId = userId;
    this.sessionData.participants.add(userId);

    this.logEvent('session_start', {
      userId,
      roomId
    });
  }

  endSession() {
    this.sessionData.endTime = new Date();
    const duration = (this.sessionData.endTime - this.sessionData.startTime) / 1000; // in seconds

    this.logEvent('session_end', {
      duration,
      participantCount: this.sessionData.participants.size,
      interactions: this.sessionData.interactions
    });

    // Send session data to server
    this.saveSessionData();
  }

  addParticipant(userId) {
    this.sessionData.participants.add(userId);
    this.logEvent('participant_join', { userId });
  }

  removeParticipant(userId) {
    this.sessionData.participants.delete(userId);
    this.logEvent('participant_leave', { userId });
  }

  logQualityChange(userId, oldQuality, newQuality, stats) {
    this.sessionData.qualityHistory.push({
      timestamp: new Date(),
      userId,
      oldQuality,
      newQuality,
      stats
    });
  }

  logNetworkStats(stats) {
    this.sessionData.networkStats.push({
      timestamp: new Date(),
      ...stats
    });
  }

  trackInteraction(type) {
    if (this.sessionData.interactions[type] !== undefined) {
      this.sessionData.interactions[type]++;
    }
  }

  logEvent(eventType, data) {
    this.sessionData.events.push({
      timestamp: new Date(),
      type: eventType,
      data
    });
  }

  async saveSessionData() {
    try {
      const sessionSummary = {
        roomId: this.sessionData.roomId,
        userId: this.sessionData.userId,
        startTime: this.sessionData.startTime,
        endTime: this.sessionData.endTime,
        duration: (this.sessionData.endTime - this.sessionData.startTime) / 1000,
        participantCount: this.sessionData.participants.size,
        participants: Array.from(this.sessionData.participants),
        qualityMetrics: this.calculateQualityMetrics(),
        interactions: this.sessionData.interactions,
        events: this.sessionData.events,
        networkStats: this.summarizeNetworkStats()
      };

      await axios.post('/api/office-hours/analytics', sessionSummary);
    } catch (error) {
      console.error('Failed to save session analytics:', error);
    }
  }

  calculateQualityMetrics() {
    const qualityData = this.sessionData.qualityHistory;
    if (qualityData.length === 0) return null;

    // Calculate time spent in each quality level
    const qualityDurations = {
      high: 0,
      medium: 0,
      low: 0,
      critical: 0
    };

    let lastQualityChange = this.sessionData.startTime;
    let currentQuality = 'high';

    qualityData.forEach((change) => {
      const duration = (change.timestamp - lastQualityChange) / 1000;
      qualityDurations[currentQuality] += duration;
      lastQualityChange = change.timestamp;
      currentQuality = change.newQuality;
    });

    // Add remaining time
    const finalDuration = (this.sessionData.endTime - lastQualityChange) / 1000;
    qualityDurations[currentQuality] += finalDuration;

    // Calculate average network stats
    const networkStats = this.sessionData.networkStats;
    const avgStats = networkStats.reduce((acc, stat) => {
      acc.rtt += stat.rtt;
      acc.packetLoss += stat.packetLoss;
      acc.bitrate += stat.bitrate;
      return acc;
    }, { rtt: 0, packetLoss: 0, bitrate: 0 });

    const statCount = networkStats.length;
    if (statCount > 0) {
      avgStats.rtt /= statCount;
      avgStats.packetLoss /= statCount;
      avgStats.bitrate /= statCount;
    }

    return {
      qualityDurations,
      averageStats: avgStats,
      qualityChanges: qualityData.length,
      stableQualityPercentage: this.calculateStableQualityPercentage()
    };
  }

  calculateStableQualityPercentage() {
    const changes = this.sessionData.qualityHistory;
    if (changes.length < 2) return 100;

    let rapidChanges = 0;
    const RAPID_CHANGE_THRESHOLD = 10000; // 10 seconds

    for (let i = 1; i < changes.length; i++) {
      const timeDiff = changes[i].timestamp - changes[i-1].timestamp;
      if (timeDiff < RAPID_CHANGE_THRESHOLD) {
        rapidChanges++;
      }
    }

    return 100 - ((rapidChanges / changes.length) * 100);
  }

  summarizeNetworkStats() {
    const stats = this.sessionData.networkStats;
    if (stats.length === 0) return null;

    const intervals = 10; // Split session into 10 intervals
    const sessionDuration = this.sessionData.endTime - this.sessionData.startTime;
    const intervalSize = sessionDuration / intervals;

    const summary = [];
    let currentInterval = this.sessionData.startTime;

    for (let i = 0; i < intervals; i++) {
      const intervalEnd = new Date(currentInterval.getTime() + intervalSize);
      
      const intervalStats = stats.filter(stat => 
        stat.timestamp >= currentInterval && stat.timestamp < intervalEnd
      );

      if (intervalStats.length > 0) {
        const avgStats = intervalStats.reduce((acc, stat) => {
          acc.rtt += stat.rtt;
          acc.packetLoss += stat.packetLoss;
          acc.bitrate += stat.bitrate;
          return acc;
        }, { rtt: 0, packetLoss: 0, bitrate: 0 });

        summary.push({
          interval: i + 1,
          startTime: currentInterval,
          endTime: intervalEnd,
          averageStats: {
            rtt: avgStats.rtt / intervalStats.length,
            packetLoss: avgStats.packetLoss / intervalStats.length,
            bitrate: avgStats.bitrate / intervalStats.length
          }
        });
      }

      currentInterval = intervalEnd;
    }

    return summary;
  }
}

export default new WebRTCAnalytics();