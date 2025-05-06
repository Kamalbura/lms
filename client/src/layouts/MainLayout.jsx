import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import ImageWithFallback from '../components/ImageWithFallback';

const MainLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user = {} } = useSelector(state => state.auth);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Add scroll progress indicator
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logout());
      navigate('/');
    }
  };

  const isInstructor = isAuthenticated && ['instructor', 'admin'].includes(user?.role);
  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isActive = path => location.pathname === path;

  const renderNavLinks = (isMobile = false) => {
    const linkClasses = isMobile 
      ? "block px-4 py-2 text-gray-700 hover:bg-gray-100" 
      : isActive => isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600';

    return (
      <>
        <Link 
          to="/" 
          className={isMobile ? linkClasses : linkClasses(isActive('/'))}
        >
          Home
        </Link>
        <Link 
          to="/courses" 
          className={isMobile ? linkClasses : linkClasses(isActive('/courses'))}
        >
          Courses
        </Link>
        
        {isAuthenticated && (
          <>
            <Link 
              to="/dashboard" 
              className={isMobile ? linkClasses : linkClasses(isActive('/dashboard'))}
            >
              Dashboard
            </Link>
            <Link 
              to="/my-assessments" 
              className={isMobile ? linkClasses : linkClasses(isActive('/my-assessments'))}
            >
              My Assessments
            </Link>
            
            {isInstructor && (
              <>
                <Link 
                  to="/create-assessment" 
                  className={isMobile ? linkClasses : linkClasses(isActive('/create-assessment'))}
                >
                  Create Quiz
                </Link>
                <Link 
                  to="/instructor/assessments" 
                  className={isMobile ? linkClasses : linkClasses(isActive('/instructor/assessments'))}
                >
                  Manage Assessments
                </Link>
              </>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
        {/* Scroll Progress Bar */}
        <div 
          className="h-1 bg-blue-600 transition-all duration-200"
          style={{ width: `${scrollProgress}%` }}
        />
        
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ProLearn LMS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Main navigation">
            {renderNavLinks()}
            
            {/* Authentication links */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(o => !o)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none group"
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="flex items-center space-x-2">
                    {user?.profileImage ? (
                      <ImageWithFallback 
                        src={user.profileImage}
                        alt={user?.name ?? 'User'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-600 group-hover:border-blue-700 transition-colors"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center border-2 border-transparent group-hover:border-blue-700 transition-colors">
                        {(user?.name?.charAt(0) || '?').toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-medium">{user?.name ?? 'User'}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role ?? 'User'}</p>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div
                  className={`absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg transition-all duration-200 transform ${
                    isDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                  role="menu"
                >
                  <div className="p-4 border-b">
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-sm text-gray-500">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <nav className="py-2">
                    <Link to="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                    
                    <Link to="/my-assessments" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      My Assessments
                    </Link>
                    
                    <Link to="/profile" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </Link>

                    {isAdmin && (
                      <Link to="/config" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}
                    
                    <hr className="my-2" />
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </nav>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav
          className={`md:hidden bg-white border-t transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="px-4 py-2 space-y-1">
            {renderNavLinks(true)}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-white text-lg font-bold mb-4">ProLearn LMS</h2>
              <p className="text-gray-400">A professional learning management system for modern education</p>
              <div className="mt-4 flex space-x-4">
                <a href="https://facebook.com" rel="noopener noreferrer" target="_blank" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://twitter.com" rel="noopener noreferrer" target="_blank" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://github.com" rel="noopener noreferrer" target="_blank" className="text-gray-400 hover:text-white">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-2">
                <li><Link to="/courses" className="text-gray-400 hover:text-white transition-colors">All Courses</Link></li>
                <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/my-assessments" className="text-gray-400 hover:text-white transition-colors">Assessments</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700">
            <p className="text-gray-400 text-sm text-center">&copy; {new Date().getFullYear()} ProLearn LMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
