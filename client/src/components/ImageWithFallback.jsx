import React from 'react';

export default function ImageWithFallback({ src, alt, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={e => { e.currentTarget.src = 'https://via.placeholder.com/150'; }}
    />
  );
}
