import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";

// Enroll user in a course
export const enrollInCourse = async (req, res) => {
  try {
    // Check if course exists
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if already enrolled
    const exists = await Enrollment.findOne({ 
      user: req.user._id, 
      course: req.params.courseId 
    });
    
    if (exists) {
      return res.status(400).json({ message: "You are already enrolled in this course" });
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({ 
      user: req.user._id, 
      course: req.params.courseId 
    });
    
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate("course", "title slug")
      .populate("user", "name email");
    
    res.status(201).json(populatedEnrollment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's enrollments
export const getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate({
        path: "course",
        select: "title slug description thumbnail instructor",
        populate: {
          path: "instructor",
          select: "name"
        }
      });
      
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update enrollment progress
export const updateProgress = async (req, res) => {
  try {
    const { progress, completedLesson } = req.body;
    
    // Find enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    // Update progress
    if (progress !== undefined) {
      enrollment.progress = progress;
    }
    
    // Add completed lesson if provided
    if (completedLesson) {
      if (!enrollment.completedLessons.includes(completedLesson)) {
        enrollment.completedLessons.push(completedLesson);
      }
    }
    
    // Update last accessed
    enrollment.lastAccessed = Date.now();
    
    await enrollment.save();
    
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Check if user is enrolled in a course
export const checkEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });
    
    res.json({ enrolled: !!enrollment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark a lesson as complete
export const markLessonComplete = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId } = req.body;
    
    if (!lessonId) {
      return res.status(400).json({ message: "Lesson ID is required" });
    }
    
    // Find enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    // Check if lesson is already marked as complete
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }
    
    // Get course to calculate total lessons
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Calculate total number of lessons in the course
    const totalLessons = course.modules.reduce((total, module) => 
      total + (module.lessons ? module.lessons.length : 0), 0);
    
    // Calculate progress percentage
    if (totalLessons > 0) {
      enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    }
    
    // Update last accessed time
    enrollment.lastAccessed = Date.now();
    
    await enrollment.save();
    
    res.json({
      enrollment,
      message: "Lesson marked as complete"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark a lesson as incomplete (to undo completion)
export const markLessonIncomplete = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId } = req.body;
    
    if (!lessonId) {
      return res.status(400).json({ message: "Lesson ID is required" });
    }
    
    // Find enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    // Remove lesson from completed lessons array
    enrollment.completedLessons = enrollment.completedLessons.filter(
      id => id !== lessonId
    );
    
    // Get course to calculate total lessons
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Calculate total number of lessons in the course
    const totalLessons = course.modules.reduce((total, module) => 
      total + (module.lessons ? module.lessons.length : 0), 0);
    
    // Calculate progress percentage
    if (totalLessons > 0) {
      enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    }
    
    await enrollment.save();
    
    res.json({
      enrollment,
      message: "Lesson marked as incomplete"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get enrollment details for specific course
export const getEnrollmentDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const enrollment = await Enrollment.findOne({ 
      user: req.user._id, 
      course: courseId 
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
