import express from "express";
import {
  createCourse, 
  getAllCourses, 
  getCourse, 
  updateCourse, 
  deleteCourse,
  getInstructorCourses
} from "../controllers/courseController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCourses);
router.get("/:slug", getCourse);

// Instructor/Admin routes
router.post("/", protect, restrictTo("instructor", "admin"), createCourse);
router.put("/:slug", protect, restrictTo("instructor", "admin"), updateCourse);
router.delete("/:slug", protect, restrictTo("instructor", "admin"), deleteCourse);
router.get("/instructor/courses", protect, restrictTo("instructor", "admin"), getInstructorCourses);

export default router;
