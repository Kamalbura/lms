import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * A component for displaying media (images, videos) with fallback support
 */
const MediaDisplay = ({ 
  src, 
  type = 'image',
  alt = 'Media content',
  className = '',
  width = 300,
  height = 200,
  lazy = true
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Reset state when src changes
    setError(false);
    setLoaded(false);
  }, [src]);

  // Get API base URL for server resources
  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return url.startsWith('/') ? `${apiBaseUrl}${url}` : url;
  };

  // Generate a placeholder URL based on dimensions and alt text
  const getPlaceholderUrl = () => {
    const text = encodeURIComponent(alt.substring(0, 20));
    return `https://via.placeholder.com/${width}x${height}?text=${text}`;
  };

  if (type === 'image') {
    const imageProps = {
      src: error ? getPlaceholderUrl() : getFullUrl(src),
      alt: `Media content for ${alt || 'lesson'}`,
      className: `${className} ${!loaded && !error ? 'animate-pulse bg-gray-200' : ''}`,
      onError: () => setError(true),
      onLoad: () => setLoaded(true),
      ...(lazy ? { loading: 'lazy' } : {})
    };

    return <img {...imageProps} />;
  }

  if (type === 'video') {
    return (
      <div className={`relative ${className}`}>
        {error ? (
          <div className="flex items-center justify-center bg-gray-200 text-gray-500" style={{ width, height }}>
            Video unavailable
          </div>
        ) : (
          <video 
            src={getFullUrl(src)} 
            controls
            className={className}
            onError={() => setError(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ width, height }}>
      <span className="text-gray-500">Media not supported</span>
    </div>
  );
};

MediaDisplay.propTypes = {
  src: PropTypes.string,
  type: PropTypes.oneOf(['image', 'video']),
  alt: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  lazy: PropTypes.bool
};

export default MediaDisplay;
