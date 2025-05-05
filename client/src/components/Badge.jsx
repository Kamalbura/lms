import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Badge = ({ 
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'full',
  withDot = false,
  className = '',
  to,
  href,
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium';
  
  const variants = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    light: 'bg-gray-100 text-gray-800 border border-gray-200',
    dark: 'bg-gray-700 text-white',
    outline: 'bg-transparent border border-current'
  };
  
  const sizes = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.75',
    lg: 'text-base px-3 py-1'
  };
  
  const roundedOptions = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };
  
  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${roundedOptions[rounded]}
    ${className}
  `;
  
  const content = (
    <>
      {withDot && (
        <span 
          className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
            variant === 'outline' 
              ? `bg-${variant.replace('outline', 'primary')}-500` 
              : 'bg-current'
          }`}
        />
      )}
      {children}
    </>
  );
  
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }
  
  if (onClick) {
    return (
      <button onClick={onClick} className={classes} {...props}>
        {content}
      </button>
    );
  }
  
  return (
    <span className={classes} {...props}>
      {content}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'danger',
    'warning', 'info', 'light', 'dark', 'outline'
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'full']),
  withDot: PropTypes.bool,
  className: PropTypes.string,
  to: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func
};

export default Badge;
