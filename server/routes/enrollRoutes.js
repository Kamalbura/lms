import express from "express";
import { 
  enrollInCourse, 
  getUserEnrollments, 
  updateProgress,
  checkEnrollment,
  markLessonComplete,
  markLessonIncomplete,
  getEnrollmentDetails
} from "../controllers/enrollController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Enrollment routes
router.post("/:courseId", enrollInCourse);
router.get("/me", getUserEnrollments);
router.put("/:courseId/progress", updateProgress);
router.get("/:courseId/check", checkEnrollment);
router.get("/:courseId/details", getEnrollmentDetails);

// Lesson completion routes
router.post("/:courseId/complete-lesson", markLessonComplete);
router.post("/:courseId/incomplete-lesson", markLessonIncomplete);

export default router;
