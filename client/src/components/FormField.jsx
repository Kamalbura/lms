import React from 'react';
import PropTypes from 'prop-types';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  helper,
  className = '',
  labelClassName = '',
  inputClassName = '',
  variant = 'outline',
  size = 'md',
  leftIcon,
  rightIcon,
  as = 'input'
}) => {
  const baseInputClasses = 'w-full rounded-md shadow-sm transition-colors duration-200';
  const variantClasses = {
    outline: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    filled: 'border-transparent bg-gray-100 focus:bg-white focus:border-primary-500',
    unstyled: ''
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-4 py-3 text-lg'
  };
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  const inputClasses = `
    ${baseInputClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${errorClasses}
    ${inputClassName}
  `;

  const Component = as;
  
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <Component
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            ${inputClasses}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
          `}
          aria-describedby={error ? `${name}-error` : helper ? `${name}-helper` : undefined}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      
      {helper && !error && (
        <p 
          id={`${name}-helper`}
          className="text-sm text-gray-500"
        >
          {helper}
        </p>
      )}
      
      {error && (
        <p 
          id={`${name}-error`}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.node,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  helper: PropTypes.node,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  variant: PropTypes.oneOf(['outline', 'filled', 'unstyled']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType])
};

export default FormField;