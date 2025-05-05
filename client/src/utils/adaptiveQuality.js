class AdaptiveQualityController {
  constructor() {
    this.samples = [];
    this.sampleWindow = 30; // Keep last 30 seconds of samples
    this.qualityChangeHandler = null;
    this.currentQuality = 'high';
    
    // Quality thresholds
    this.thresholds = {
      rtt: {
        high: 150,    // ms
        medium: 300,
        low: 500
      },
      packetLoss: {
        high: 2,      // %
        medium: 5,
        low: 10
      },
      bitrate: {
        high: 1500000, // 1.5 Mbps
        medium: 750000, // 750 Kbps
        low: 250000    // 250 Kbps
      }
    };

    // Video constraints for different quality levels
    this.constraints = {
      high: {
        width: 1280,
        height: 720,
        frameRate: 30,
        maxBitrate: 1500000
      },
      medium: {
        width: 640,
        height: 480,
        frameRate: 25,
        maxBitrate: 750000
      },
      low: {
        width: 320,
        height: 240,
        frameRate: 20,
        maxBitrate: 250000
      },
      critical: {
        width: 160,
        height: 120,
        frameRate: 15,
        maxBitrate: 100000
      }
    };
  }

  setQualityChangeHandler(handler) {
    this.qualityChangeHandler = handler;
  }

  addSample(stats) {
    const now = Date.now();
    this.samples.push({ ...stats, timestamp: now });
    
    // Remove old samples
    this.samples = this.samples.filter(
      sample => (now - sample.timestamp) <= this.sampleWindow * 1000
    );

    this.evaluateQuality();
  }

  evaluateQuality() {
    if (this.samples.length < 3) return; // Need at least 3 samples

    // Calculate averages
    const avgStats = this.calculateAverages();
    
    // Determine quality level based on network conditions
    let newQuality = this.determineQualityLevel(avgStats);
    
    // Apply hysteresis to prevent rapid quality changes
    if (this.shouldChangeQuality(newQuality)) {
      const oldQuality = this.currentQuality;
      this.currentQuality = newQuality;
      
      if (this.qualityChangeHandler) {
        this.qualityChangeHandler({
          quality: newQuality,
          constraints: this.constraints[newQuality],
          stats: avgStats,
          previousQuality: oldQuality
        });
      }
    }
  }

  calculateAverages() {
    const recentSamples = this.samples.slice(-5); // Use last 5 samples
    return {
      rtt: recentSamples.reduce((sum, s) => sum + s.rtt, 0) / recentSamples.length,
      packetLoss: recentSamples.reduce((sum, s) => sum + s.packetLoss, 0) / recentSamples.length,
      bitrate: recentSamples.reduce((sum, s) => sum + s.bitrate, 0) / recentSamples.length
    };
  }

  determineQualityLevel(stats) {
    // Score each metric (0-3, where 3 is best)
    let scores = {
      rtt: 3,
      packetLoss: 3,
      bitrate: 3
    };

    // RTT scoring
    if (stats.rtt > this.thresholds.rtt.low) scores.rtt = 0;
    else if (stats.rtt > this.thresholds.rtt.medium) scores.rtt = 1;
    else if (stats.rtt > this.thresholds.rtt.high) scores.rtt = 2;

    // Packet loss scoring
    if (stats.packetLoss > this.thresholds.packetLoss.low) scores.packetLoss = 0;
    else if (stats.packetLoss > this.thresholds.packetLoss.medium) scores.packetLoss = 1;
    else if (stats.packetLoss > this.thresholds.packetLoss.high) scores.packetLoss = 2;

    // Bitrate scoring
    if (stats.bitrate < this.thresholds.bitrate.low) scores.bitrate = 0;
    else if (stats.bitrate < this.thresholds.bitrate.medium) scores.bitrate = 1;
    else if (stats.bitrate < this.thresholds.bitrate.high) scores.bitrate = 2;

    // Calculate average score
    const avgScore = (scores.rtt + scores.packetLoss + scores.bitrate) / 3;

    // Map average score to quality level
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    if (avgScore >= 0.5) return 'low';
    return 'critical';
  }

  shouldChangeQuality(newQuality) {
    if (newQuality === this.currentQuality) return false;

    // Quality level map for determining "distance" between qualities
    const qualityLevels = {
      high: 3,
      medium: 2,
      low: 1,
      critical: 0
    };

    // Get more samples before moving up in quality
    if (qualityLevels[newQuality] > qualityLevels[this.currentQuality]) {
      return this.samples.length >= 10;
    }

    // Allow faster degradation in quality
    return true;
  }

  reset() {
    this.samples = [];
    this.currentQuality = 'high';
  }

  getCurrentConstraints() {
    return this.constraints[this.currentQuality];
  }
}

export default new AdaptiveQualityController();