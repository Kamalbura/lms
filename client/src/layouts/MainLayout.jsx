import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import ImageWithFallback from '../components/ImageWithFallback';

const MainLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logout());
      navigate('/');
    }
  };

  const isInstructor = ['instructor', 'admin'].includes(user?.role);
  const isAdmin = user?.role === 'admin';
  const isActive = path => location.pathname === path;

  // Function to render navigation links based on auth status and user role
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
        
        {/* Authenticated user links */}
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
            
            {/* Instructor/Admin links */}
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
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            ProLearn LMS
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4" aria-label="Main navigation">
            {renderNavLinks()}
            
            {/* Authentication links */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(o => !o)}
                  className="flex items-center text-gray-700 hover:text-blue-600 focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="mr-1">{user.name}</span>
                  {user?.profileImage ? (
                    <ImageWithFallback 
                      src={user.profileImage}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 ml-2"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ml-2 border border-gray-200">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <svg className={`w-4 h-4 transition-transform ml-1 ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>
                <div
                  className={`absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg transition-opacity ${
                    isDropdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  role="menu"
                  aria-label="User menu"
                >
                  <p className="px-4 py-2 text-sm text-gray-500">Role: {user.role}</p>
                  <hr />
                  <Link to="/my-submissions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                    My Submissions
                  </Link>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                    Profile Settings
                  </Link>
                  {isAdmin && (
                    <Link to="/config" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      Admin Dashboard
                    </Link>
                  )}
                  <hr />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setIsMobileMenuOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav
          className={`md:hidden bg-white border-t transition-max-height duration-300 overflow-hidden ${
            isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          {renderNavLinks(true)}
          
          {/* Authentication links for mobile */}
          {isAuthenticated ? (
            <>
              <Link to="/my-submissions" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                My Submissions
              </Link>
              <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                Profile Settings
              </Link>
              {isAdmin && (
                <Link to="/config" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Admin Dashboard
                </Link>
              )}
              <button 
                onClick={handleLogout} 
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                Login
              </Link>
              <Link to="/register" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-grow bg-gray-50">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-lg font-bold mb-2">ProLearn LMS</h2>
              <p className="text-gray-300">A professional learning management system for CSE students</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase">Resources</h3>
                <ul role="menu" aria-label="Resource links" className="space-y-2">
                  <li><Link to="/courses" className="hover:text-white">Courses</Link></li>
                  <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
                  <li><Link to="/my-assessments" className="hover:text-white">Assessments</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase">Company</h3>
                <ul role="menu" aria-label="Company links" className="space-y-2">
                  <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} ProLearn LMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
