import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  fullWidth = false,
  rounded = 'md',
  leftIcon,
  rightIcon,
  onClick,
  to,
  href,
  target,
  rel,
  ...props
}) => {
  const [coords, setCoords] = React.useState({ x: -1, y: -1 });
  const [isRippling, setIsRippling] = React.useState(false);

  React.useEffect(() => {
    if (coords.x !== -1 && coords.y !== -1) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 300);
    } else {
      setIsRippling(false);
    }
  }, [coords]);

  React.useEffect(() => {
    if (!isRippling) setCoords({ x: -1, y: -1 });
  }, [isRippling]);

  const baseClasses = `
    relative
    inline-flex
    items-center
    justify-center
    font-medium
    transition-all
    duration-200
    ease-in-out
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'cursor-not-allowed' : ''}
    ${isLoading ? 'relative !text-transparent' : ''}
    overflow-hidden
    transform
    hover:scale-[1.02]
    active:scale-[0.98]
  `;

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 disabled:bg-yellow-300',
    info: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400 disabled:bg-blue-300',
    light: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300 disabled:bg-gray-50 disabled:text-gray-400',
    dark: 'bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-700 disabled:bg-gray-600',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 disabled:border-primary-300 disabled:text-primary-300',
    outlineGray: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 disabled:text-gray-400',
    link: 'text-primary-600 hover:text-primary-700 hover:underline focus:ring-primary-500 disabled:text-primary-300 p-0',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300 disabled:text-gray-400'
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const roundedOptions = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  const handleClick = (e) => {
    if (disabled || isLoading) return;
    
    const rect = e.target.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    
    onClick?.(e);
  };

  const buttonContent = (
    <>
      {isRippling && (
        <span
          className="absolute animate-ripple rounded-full bg-white/30"
          style={{
            left: coords.x,
            top: coords.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      
      {leftIcon && (
        <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      )}
      
      <span className={`relative z-10 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      
      {rightIcon && !isLoading && (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-5 w-5 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
    </>
  );

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${roundedOptions[rounded]}
    ${className}
  `;

  // If it's a link
  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        onClick={handleClick}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }

  // If it's an external link
  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={classes}
        onClick={handleClick}
        {...props}
      >
        {buttonContent}
      </a>
    );
  }

  // Regular button
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {buttonContent}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'danger',
    'warning', 'info', 'light', 'dark',
    'outline', 'outlineGray', 'link', 'ghost'
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', 'full']),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  onClick: PropTypes.func,
  to: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string
};

export default Button;
