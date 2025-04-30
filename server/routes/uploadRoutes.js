import express from 'express';
import { uploadCourseThumbnail, uploadLessonMaterial, deleteFile } from '../controllers/uploadController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import upload from '../utils/fileUpload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Course thumbnail upload (for instructors)
router.post(
  '/thumbnail',
  restrictTo('instructor', 'admin'),
  upload.single('thumbnail'),
  uploadCourseThumbnail
);

// Lesson material upload (for instructors)
router.post(
  '/lesson-material',
  restrictTo('instructor', 'admin'),
  upload.single('material'),
  uploadLessonMaterial
);

// Delete file (for instructors)
router.delete(
  '/delete-file',
  restrictTo('instructor', 'admin'),
  deleteFile
);

export default router;
