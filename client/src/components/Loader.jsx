import React from 'react';
import PropTypes from 'prop-types';

const Loader = ({ size = 'md', color = 'blue', fullScreen = false, text = 'Loading...' }) => {
  // Define sizes
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  // Define colors
  const colors = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    gray: 'border-gray-500'
  };
  
  const spinnerSize = sizes[size] || sizes.md;
  const spinnerColor = colors[color] || colors.blue;

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`${spinnerSize} animate-spin rounded-full border-b-2 ${spinnerColor}`}></div>
      {text && <p className="mt-2 text-gray-600 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

Loader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['blue', 'green', 'red', 'yellow', 'gray']),
  fullScreen: PropTypes.bool,
  text: PropTypes.string
};

export default Loader;
