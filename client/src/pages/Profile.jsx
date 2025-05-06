import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { getUserProfile } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/ImageWithFallback';

const Profile = () => {
  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  // Add helper function to get full URL for images
  const getFullImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/') 
      ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`
      : path;
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      setProfileLoading(true);
      
      await axios.put(
        '/api/auth/profile',
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh user data in Redux store
      dispatch(getUserProfile());
      
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      await axios.put(
        '/api/auth/password',
        { 
          currentPassword, 
          newPassword 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Clear password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Max 5MB file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploadingImage(true);
      
      await axios.post('/api/auth/upload-avatar', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update redux store with new user data (including profile image)
      dispatch(getUserProfile());
      toast.success('Profile image updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      
      {/* Avatar Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Profile Picture</h2>
        </div>
        
        <div className="p-6 flex flex-col items-center md:flex-row md:items-start">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            {user?.profileImage ? (
              <ImageWithFallback 
                src={getFullImageUrl(user.profileImage)} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          <div className="flex-grow">
            <h3 className="font-medium text-lg mb-2">Upload a new photo</h3>
            <p className="text-gray-600 text-sm mb-3">
              Your profile photo will be visible to other users on the platform. 
              For best results, use an image that's at least 200×200 pixels.
            </p>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>
              
              {user?.profileImage && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await axios.delete('/api/auth/remove-avatar', {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      dispatch(getUserProfile());
                      toast.success('Profile image removed');
                    } catch (err) {
                      toast.error('Failed to remove image');
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Account Information Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Account Information</h2>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                placeholder="Your email address"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md capitalize"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <input
                type="text"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleProfileUpdate}
              disabled={profileLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Password Change Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Change Password</h2>
        </div>
        
        <div className="p-6">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter your current password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              >
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
