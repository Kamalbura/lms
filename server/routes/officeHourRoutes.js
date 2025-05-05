import express from "express";
import multer from "multer";
import {
  getInstructorOfficeHours,
  createOfficeHour,
  getOfficeHours,
  getOfficeHour,
  updateOfficeHour,
  cancelOfficeHour,
  startSession,
  endSession,
  addNote,
  addFeedback,
  logEvent,
  updateNetworkMetrics,
  uploadRecording
} from "../controllers/officeHourController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for recording uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/recordings");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `recording-${uniqueSuffix}.webm`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

// Protect all routes
router.use(protect);

// Routes accessible by all authenticated users
router.get("/", getOfficeHours);
router.get("/:id", getOfficeHour);
router.get("/instructor/:instructorId", getInstructorOfficeHours);
router.post("/:id/notes", addNote);
router.post("/:id/events", logEvent);
router.post("/:id/network-metrics", updateNetworkMetrics);

// Routes restricted to instructors
router.post("/", restrictTo("instructor"), createOfficeHour);
router.patch("/:id", restrictTo("instructor"), updateOfficeHour);
router.post("/:id/start", restrictTo("instructor"), startSession);
router.post("/:id/end", restrictTo("instructor"), endSession);
router.post(
  "/:id/recording",
  restrictTo("instructor"),
  upload.single("recording"),
  uploadRecording
);

// Routes for both instructors and students
router.post("/:id/cancel", cancelOfficeHour);
router.post("/:id/feedback", restrictTo("student"), addFeedback);

export default router;
