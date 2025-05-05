import React from 'react';
import PropTypes from 'prop-types';

const Skeleton = ({ 
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  animated = true,
  light = false,
  rounded = 'md'
}) => {
  const baseClasses = `${animated ? 'animate-pulse' : ''} ${light ? 'bg-white/20' : 'bg-gray-200'} overflow-hidden`;
  
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };
  
  const variantClasses = {
    text: 'h-4',
    title: 'h-6',
    button: 'h-10',
    avatar: 'rounded-full h-10 w-10',
    image: 'h-40 w-full',
    thumbnail: 'h-16 w-16',
    card: 'h-32 w-full',
    input: 'h-10 w-full',
    circle: 'rounded-full'
  };
  
  const customStyle = {
    width: width,
    height: height
  };
  
  const items = [];
  
  for (let i = 0; i < count; i++) {
    items.push(
      <div 
        key={i}
        className={`${baseClasses} ${variantClasses[variant]} ${roundedClasses[rounded]} ${className} ${i !== 0 ? 'mt-2' : ''}`}
        style={customStyle}
        aria-hidden="true"
      ></div>
    );
  }
  
  return <>{items}</>;
};

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'title', 'button', 'avatar', 'image', 'thumbnail', 'card', 'input', 'circle']),
  width: PropTypes.string,
  height: PropTypes.string,
  count: PropTypes.number,
  className: PropTypes.string,
  animated: PropTypes.bool,
  light: PropTypes.bool,
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', 'full']),
};

export default Skeleton;