import React from 'react';
import PropTypes from 'prop-types';

export const LoadingCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 h-48 rounded-t-lg"></div>
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

export const LoadingTable = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse">
    <div className="bg-gray-100 p-4 rounded-t-lg">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
    <div className="divide-y">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(cols)].map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const LoadingForm = () => (
  <div className="animate-pulse space-y-4">
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
    <div className="flex justify-end">
      <div className="h-10 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

export const LoadingAvatar = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  return (
    <div className={`animate-pulse rounded-full bg-gray-200 ${sizeClasses[size]}`}></div>
  );
};

export const LoadingProgress = () => (
  <div className="animate-pulse space-y-2">
    <div className="flex justify-between">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
      <div className="h-4 bg-gray-200 rounded w-12"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded"></div>
  </div>
);

export const LoadingSidebar = ({ items = 5 }) => (
  <div className="animate-pulse space-y-4 w-64 p-4">
    <div className="h-10 bg-gray-200 rounded"></div>
    <div className="space-y-2">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="h-8 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

export const LoadingGrid = ({ items = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(items)].map((_, i) => (
      <LoadingCard key={i} />
    ))}
  </div>
);

LoadingTable.propTypes = {
  rows: PropTypes.number,
  cols: PropTypes.number
};

LoadingAvatar.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])
};

LoadingSidebar.propTypes = {
  items: PropTypes.number
};

LoadingGrid.propTypes = {
  items: PropTypes.number
};