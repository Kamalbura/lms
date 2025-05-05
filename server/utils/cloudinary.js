import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const uploadVideo = async (filePath, options = {}) => {
  try {
    const defaults = {
      resource_type: 'video',
      folder: 'office-hours/recordings',
      overwrite: true,
      quality: 'auto',
      fetch_format: 'auto',
      flags: 'attachment'
    };

    const result = await cloudinary.uploader.upload(filePath, {
      ...defaults,
      ...options
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      duration: result.duration,
      size: result.bytes
    };
  } catch (error) {
    logger.error('Cloudinary video upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const deleteVideo = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });

    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    logger.error('Cloudinary video deletion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const generateVideoThumbnail = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
      image_metadata: true,
      video_metadata: true
    });

    const thumbnailUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        { width: 480, crop: 'scale' },
        { fetch_format: 'auto', quality: 'auto' },
        { start_offset: '0' }
      ]
    });

    return {
      success: true,
      url: thumbnailUrl,
      metadata: {
        duration: result.duration,
        format: result.format,
        size: result.bytes
      }
    };
  } catch (error) {
    logger.error('Cloudinary thumbnail generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export {
  cloudinary as default,
  uploadVideo,
  deleteVideo,
  generateVideoThumbnail
};
