import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

const CourseCreate = () => {
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Course form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('beginner');
  const [price, setPrice] = useState(0);
  const [modules, setModules] = useState([
    { title: '', lessons: [{ title: '', content: '', duration: 0 }] }
  ]);
  const [thumbnail, setThumbnail] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  
  const addModule = () => {
    setModules([...modules, { title: '', lessons: [{ title: '', content: '', duration: 0 }] }]);
  };
  
  const removeModule = (moduleIndex) => {
    const updatedModules = [...modules];
    updatedModules.splice(moduleIndex, 1);
    setModules(updatedModules);
  };
  
  const updateModule = (moduleIndex, field, value) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex][field] = value;
    setModules(updatedModules);
  };
  
  const addLesson = (moduleIndex) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push({ title: '', content: '', duration: 0 });
    setModules(updatedModules);
  };
  
  const removeLesson = (moduleIndex, lessonIndex) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.splice(lessonIndex, 1);
    setModules(updatedModules);
  };
  
  const updateLesson = (moduleIndex, lessonIndex, field, value) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex][field] = value;
    setModules(updatedModules);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    // Max size 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    
    setThumbnailFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnail(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      let thumbnailPath = '';
      
      // Upload thumbnail if selected
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);
        
        const uploadResponse = await axios.post('/api/uploads/thumbnail', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        thumbnailPath = uploadResponse.data.filePath;
      }
      
      // Create course with thumbnail path
      const courseData = {
        title,
        description,
        category,
        level,
        price: parseFloat(price),
        modules,
        thumbnail: thumbnailPath
      };
      
      const response = await axios.post('/api/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate(`/course/${response.data.slug}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Create New Course</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Course Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Thumbnail
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                {thumbnail ? (
                  <div className="text-center">
                    <img
                      src={thumbnail}
                      alt="Thumbnail preview"
                      className="mx-auto h-48 w-auto object-cover mb-4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnail('');
                        setThumbnailFile(null);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="thumbnail-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="thumbnail-upload"
                          name="thumbnail-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleThumbnailUpload}
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Course Content</h2>
            <button
              type="button"
              onClick={addModule}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Add Module
            </button>
          </div>
          
          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <div key={moduleIndex} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-grow mr-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module Title
                    </label>
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModule(moduleIndex)}
                    className="mt-6 text-red-500"
                    disabled={modules.length <= 1}
                  >
                    Remove
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Lessons</h3>
                    <button
                      type="button"
                      onClick={() => addLesson(moduleIndex)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    >
                      Add Lesson
                    </button>
                  </div>
                  
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Lesson {lessonIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeLesson(moduleIndex, lessonIndex)}
                          className="text-red-500 text-sm"
                          disabled={module.lessons.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lesson Title
                          </label>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={lesson.duration}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'duration', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                          </label>
                          <textarea
                            value={lesson.content}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'content', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseCreate;
