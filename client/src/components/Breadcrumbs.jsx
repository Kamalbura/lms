import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = ({ 
  items = [], 
  separator = "/", 
  homeIcon = true,
  className = ""
}) => {
  const location = useLocation();
  
  // If no items are provided, generate them from the current path
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs(location.pathname);
  
  return (
    <nav className={`text-sm text-gray-600 ${className}`} aria-label="Breadcrumb">
      <ol className="list-none p-0 flex flex-wrap items-center">
        {homeIcon && (
          <li className="flex items-center">
            <Link 
              to="/" 
              className="hover:text-blue-600 transition-colors"
              aria-label="Home"
            >
              <svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </Link>
            <span className="mx-2 text-gray-400" aria-hidden="true">{separator}</span>
          </li>
        )}
        
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index < breadcrumbItems.length - 1 ? (
              <>
                <Link 
                  to={item.path} 
                  className="hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
                <span className="mx-2 text-gray-400" aria-hidden="true">{separator}</span>
              </>
            ) : (
              <span className="font-medium text-gray-800" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Helper function to generate breadcrumbs from path
const generateBreadcrumbs = (path) => {
  const paths = path.split('/').filter(Boolean);
  
  // Map common path names to more readable labels
  const pathNameMap = {
    'courses': 'Courses',
    'course': 'Course',
    'dashboard': 'Dashboard',
    'profile': 'My Profile',
    'assessments': 'Assessments',
    'submissions': 'Submissions',
    'create': 'Create',
    'edit': 'Edit',
  };
  
  return paths.map((path, index) => {
    // Create the link path up to this point
    const linkPath = `/${paths.slice(0, index + 1).join('/')}`;
    
    // Use the mapped name if available, otherwise capitalize the path
    const label = pathNameMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
    
    return { label, path: linkPath };
  });
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ),
  separator: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  homeIcon: PropTypes.bool,
  className: PropTypes.string,
};

export default Breadcrumbs;
