import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses } from '../redux/slices/courseSlice';
import ImageWithFallback from '../components/ImageWithFallback';

const CoursesList = () => {
  const dispatch = useDispatch();
  const { courses, loading, error, totalPages, currentPage } = useSelector(state => state.courses);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  
  // Updated categories to match the Course model enum
  const categories = ['CSE', 'IoT', 'Embedded Systems', 'Skill Development', 'Robotics'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  // Helper function to get full URL for images
  const getFullImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/') 
      ? `${process.env.REACT_APP_API_URL || ''}${path}`
      : path;
  };

  useEffect(() => {
    dispatch(fetchCourses({ page, search: searchTerm, category, level, limit: 20 }));
  }, [dispatch, page, searchTerm, category, level]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    dispatch(fetchCourses({ page: 1, search: searchTerm, category, level, limit: 20 }));
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setCategory('');
    setLevel('');
    setPage(1);
    dispatch(fetchCourses({ page: 1, limit: 20 }));
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">All Courses</h1>
      
      {/* Search and filters */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Search courses..."
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Levels</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
      
      {courses.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-2">No courses found</h2>
          <p className="text-gray-500">Try changing your search criteria or check back later for new courses.</p>
        </div>
      ) : (
        <div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div
                key={course._id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                {course.thumbnail ? (
                  <ImageWithFallback
                    src={getFullImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    fallbackSrc="https://via.placeholder.com/400x200?text=No+Image"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">{course.title.charAt(0)}</span>
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {course.level}
                      </span>
                      <span className="ml-2 text-gray-600 text-sm">{course.category || 'Uncategorized'}</span>
                    </div>
                    <Link
                      to={`/course/${course.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Course →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-md">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoursesList;
