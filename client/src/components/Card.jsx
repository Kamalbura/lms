import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Skeleton from './Skeleton';

const Card = ({
  title,
  subtitle,
  children,
  className = '',
  to,
  href,
  onClick,
  footer,
  header,
  isLoading,
  hover = true,
  variant = 'default',
  image,
  imageAlt,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-soft overflow-hidden transition-all duration-200';
  
  const variants = {
    default: '',
    outline: 'border border-gray-200',
    elevated: 'shadow-md hover:shadow-lg',
    floating: 'shadow-lg hover:shadow-xl transform hover:-translate-y-1',
  };

  const hoverClasses = hover ? 'hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10' : '';
  
  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${hoverClasses}
    ${className}
  `.trim();

  const content = (
    <>
      {isLoading ? (
        <div className="p-4 space-y-4">
          <Skeleton variant="title" className="mb-2" />
          <Skeleton variant="text" count={3} />
        </div>
      ) : (
        <>
          {image && (
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={image} 
                alt={imageAlt} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          )}
          {header && <div className="p-4 border-b border-gray-100">{header}</div>}
          <div className="p-4">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mb-4">
                {subtitle}
              </p>
            )}
            {children}
          </div>
          {footer && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              {footer}
            </div>
          )}
        </>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`${classes} cursor-pointer`}
        {...props}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={`${classes} cursor-pointer`}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={`${classes} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      {...props}
    >
      {content}
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  to: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func,
  footer: PropTypes.node,
  header: PropTypes.node,
  isLoading: PropTypes.bool,
  hover: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'outline', 'elevated', 'floating']),
  image: PropTypes.string,
  imageAlt: PropTypes.string,
};

export default Card;