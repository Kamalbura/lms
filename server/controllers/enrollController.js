import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import Certificate from "../models/Certificate.js";
import certificateGenerator from "../utils/certificateGenerator.js";
import logger from "../utils/logger.js";

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
    }).populate("course", "title instructor");
    
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
      const newProgress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
      enrollment.progress = newProgress;
      
      // If course is now complete (100%), generate certificate
      if (newProgress === 100 && (!enrollment.completed || !enrollment.certificate?.certificateId)) {
        enrollment.completed = true;
        enrollment.completedAt = new Date();
        
        try {
          // Get user information
          const user = await User.findById(req.user._id);
          
          // Get instructor name
          const instructorName = course.instructor 
            ? (await User.findById(course.instructor)).name 
            : 'Course Instructor';
          
          // Generate certificate
          const certificateData = await certificateGenerator.generateCertificate({
            studentName: user.name,
            courseName: course.title,
            completionDate: new Date().toISOString(),
            instructorName,
            courseId: course._id,
            userId: user._id
          });
          
          // Save certificate in database
          const certificate = await Certificate.create({
            certificateId: certificateData.certificateId,
            student: user._id,
            course: course._id,
            issuedAt: new Date(),
            issuedBy: instructorName,
            certificateUrl: certificateData.certificateUrl,
            verificationUrl: certificateData.verificationUrl,
            metadata: {
              template: 'default',
              completionScore: enrollment.averageScore || 0,
              hoursSpent: enrollment.totalTimeSpent || 0
            }
          });
          
          // Update enrollment with certificate information
          enrollment.certificate = {
            issued: true,
            issuedAt: new Date(),
            certificateId: certificateData.certificateId,
            certificateUrl: certificateData.certificateUrl
          };
          
          logger.info(`Certificate generated for user ${user._id} completing course ${course._id}`);
        } catch (certError) {
          logger.error(`Failed to generate certificate: ${certError.message}`, { userId: req.user._id, courseId });
          // Don't fail the request if certificate generation fails
        }
      }
    }
    
    // Update last accessed time
    enrollment.lastAccessed = new Date();
    
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
