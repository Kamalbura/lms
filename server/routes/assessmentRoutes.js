import express from 'express';
import {
  createAssessment,
  getCourseAssessments,
  getAssessment,
  submitAssessment,
  getSubmission,
  getSubmissions,
  getMySubmissions,
  gradeSubmission
} from '../controllers/assessmentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes need authentication
router.use(protect);

// Assessment routes
router.post("/", restrictTo("instructor", "admin"), createAssessment);
router.get("/course/:courseId", getCourseAssessments);
router.get("/:assessmentId", getAssessment);
router.post("/submit/:assessmentId", submitAssessment);

// Submission routes
router.get("/submissions/me", getMySubmissions);
router.get("/:assessmentId/submissions", restrictTo("instructor", "admin"), getSubmissions);
router.get("/submissions/:submissionId", getSubmission);
router.put("/grade/:submissionId", restrictTo("instructor", "admin"), gradeSubmission);

export default router;
