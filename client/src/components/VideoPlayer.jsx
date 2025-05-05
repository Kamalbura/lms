import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

const VideoPlayer = ({
  src,
  title,
  poster,
  onProgress,
  onComplete,
  className = ''
}) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const controlsTimeout = useRef(null);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onProgress?.(video.currentTime / video.duration * 100);
      
      // Mark as complete when reaching 90% of the video
      if (video.currentTime / video.duration >= 0.9) {
        onComplete?.();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onProgress, onComplete]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleVolumeChange = (e) => {
    const value = e.target.value;
    setVolume(value);
    videoRef.current.volume = value;
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const changePlaybackSpeed = (speed) => {
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  return (
    <div 
      className={`relative group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full rounded-lg"
        src={src}
        poster={poster}
        onClick={handlePlayPause}
        onDoubleClick={toggleFullscreen}
      />

      {/* Custom Controls */}
      <div className={`
        absolute bottom-0 left-0 right-0 
        bg-gradient-to-t from-black/70 to-transparent
        px-4 py-2
        transition-opacity duration-300
        ${showControls ? 'opacity-100' : 'opacity-0'}
      `}>
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="h-1 bg-gray-600 rounded cursor-pointer mb-2"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-primary-500 rounded"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button onClick={handlePlayPause} className="focus:outline-none">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button onClick={toggleMute} className="focus:outline-none">
                {isMuted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zm5.274-.147a1 1 0 011.414 0A8.001 8.001 0 0118 10a8.001 8.001 0 01-1.929 5.207 1 1 0 01-1.414-1.414A6.001 6.001 0 0016 10a6.001 6.001 0 00-1.343-3.793 1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <input
                ref={volumeRef}
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Time Display */}
            <div className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Playback Speed */}
            <select
              value={playbackSpeed}
              onChange={(e) => changePlaybackSpeed(Number(e.target.value))}
              className="bg-transparent text-white text-sm focus:outline-none"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                <option key={speed} value={speed} className="text-black">
                  {speed}x
                </option>
              ))}
            </select>

            {/* Quality Selection */}
            {user?.preferences?.quality && (
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none"
              >
                <option value="auto" className="text-black">Auto</option>
                <option value="1080p" className="text-black">1080p</option>
                <option value="720p" className="text-black">720p</option>
                <option value="480p" className="text-black">480p</option>
                <option value="360p" className="text-black">360p</option>
              </select>
            )}

            {/* Fullscreen Toggle */}
            <button onClick={toggleFullscreen} className="focus:outline-none">
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4a1 1 0 011-1h4a1 1 0 010 2H6a1 1 0 01-1-1zm10 0a1 1 0 01-1-1h-4a1 1 0 110-2h4a1 1 0 011 1zM5 16a1 1 0 001 1h4a1 1 0 100-2H6a1 1 0 00-1 1zm10 0a1 1 0 00-1 1h-4a1 1 0 110 2h4a1 1 0 001-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H4a1 1 0 01-1-1zm12 0a1 1 0 01-1-1h-4a1 1 0 110-2h4a1 1 0 011 1zM3 16a1 1 0 001 1h4a1 1 0 100-2H4a1 1 0 00-1 1zm12 0a1 1 0 00-1 1h-4a1 1 0 110 2h4a1 1 0 001-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

VideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string,
  poster: PropTypes.string,
  onProgress: PropTypes.func,
  onComplete: PropTypes.func,
  className: PropTypes.string
};

export default VideoPlayer;