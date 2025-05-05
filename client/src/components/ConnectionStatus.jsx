import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adaptiveQuality from '../utils/adaptiveQuality';

const ConnectionStatus = ({ peerConnection, onQualityChange }) => {
  const [quality, setQuality] = useState('high');
  const [stats, setStats] = useState({
    rtt: 0,
    packetLoss: 0,
    bitrate: 0
  });

  useEffect(() => {
    if (!peerConnection) return;

    let statsInterval;
    
    const getConnectionStats = async () => {
      try {
        const stats = await peerConnection.getStats();
        let rtt = 0;
        let packetLoss = 0;
        let bitrate = 0;
        let lastBytesReceived = 0;
        let lastTimestamp = 0;
        
        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime * 1000; // Convert to ms
          }
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            packetLoss = report.packetsLost;
            if (report.bytesReceived && report.timestamp) {
              const bytesReceived = report.bytesReceived;
              const timestamp = report.timestamp;
              
              if (lastBytesReceived > 0) {
                const bytesDelta = bytesReceived - lastBytesReceived;
                const timeDelta = timestamp - lastTimestamp;
                bitrate = (8 * bytesDelta) / timeDelta; // bits per second
              }
              
              lastBytesReceived = bytesReceived;
              lastTimestamp = timestamp;
            }
          }
        });

        // Update stats state
        setStats({ rtt, packetLoss, bitrate });
        
        // Feed data to adaptive quality controller
        adaptiveQuality.addSample({ rtt, packetLoss, bitrate });
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    };

    // Set up quality change handler
    adaptiveQuality.setQualityChangeHandler(({ quality, constraints }) => {
      setQuality(quality);
      if (onQualityChange) {
        onQualityChange(quality, constraints);
      }
      
      // Show quality change notification
      const qualityMessages = {
        high: '🟢 Connection is excellent',
        medium: '🟡 Connection is good',
        low: '🟠 Connection is moderate',
        critical: '🔴 Connection is poor'
      };
      
      toast.info(qualityMessages[quality], {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: true
      });
    });

    // Start monitoring stats
    statsInterval = setInterval(getConnectionStats, 2000);

    return () => {
      if (statsInterval) {
        clearInterval(statsInterval);
      }
      adaptiveQuality.reset();
    };
  }, [peerConnection, onQualityChange]);

  const getQualityColor = () => {
    switch (quality) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatBitrate = (bps) => {
    if (bps > 1000000) {
      return `${(bps / 1000000).toFixed(1)} Mbps`;
    }
    if (bps > 1000) {
      return `${(bps / 1000).toFixed(1)} Kbps`;
    }
    return `${Math.round(bps)} bps`;
  };

  return (
    <div className="flex items-center space-x-2 py-1 px-2 rounded-md bg-gray-100">
      <div className={`w-3 h-3 rounded-full ${getQualityColor()}`} />
      <div className="text-sm">
        <span className="font-medium mr-2">{quality.charAt(0).toUpperCase() + quality.slice(1)}</span>
        <span className="text-gray-600">
          {stats.rtt.toFixed(0)}ms
          {stats.bitrate > 0 && ` • ${formatBitrate(stats.bitrate)}`}
          {stats.packetLoss > 0 && ` • ${stats.packetLoss} packets lost`}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;