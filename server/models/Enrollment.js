import mongoose from "mongoose";

const lessonProgressSchema = new mongoose.Schema({
  lessonId: { type: String, required: true },
  completed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 }, // in minutes
  lastAccessed: { type: Date },
  completedAt: { type: Date },
  attempts: [{
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  }]
});

const moduleProgressSchema = new mongoose.Schema({
  moduleId: { type: String, required: true },
  lessons: [lessonProgressSchema],
  completed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 }, // in minutes
  completedAt: { type: Date }
});

const assessmentProgressSchema = new mongoose.Schema({
  assessmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Assessment" 
  },
  attempts: [{
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission"
    },
    score: Number,
    maxScore: Number,
    submittedAt: Date
  }],
  bestScore: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
});

const enrollmentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true 
  },
  enrolledAt: { 
    type: Date, 
    default: Date.now 
  },
  // Overall progress percentage
  progress: { 
    type: Number, 
    default: 0 
  },
  // Detailed progress tracking
  moduleProgress: [moduleProgressSchema],
  assessmentProgress: [assessmentProgressSchema],
  // Time tracking
  totalTimeSpent: { 
    type: Number, 
    default: 0 // in minutes
  },
  lastAccessed: { 
    type: Date 
  },
  // Simple tracking of completed lessons (by ID)
  completedLessons: {
    type: [String],
    default: []
  },
  // Activity tracking
  activityLog: [{
    action: {
      type: String,
      enum: ['started_lesson', 'completed_lesson', 'started_assessment', 
             'completed_assessment', 'downloaded_resource', 'posted_discussion']
    },
    itemId: String, // ID of lesson/assessment/resource
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  // Engagement metrics
  engagementMetrics: {
    discussionPosts: { type: Number, default: 0 },
    resourceDownloads: { type: Number, default: 0 },
    videoWatched: { type: Number, default: 0 }, // in minutes
    lastEngagement: Date
  },
  // Certificate tracking
  certificate: { 
    issued: { type: Boolean, default: false },
    issuedAt: { type: Date },
    certificateId: String,
    certificateUrl: String
  },
  // Course feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    givenAt: Date
  },
  // Completion tracking
  completedAt: { 
    type: Date 
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'refunded'],
    default: 'active'
  }
});

// Create a compound index to ensure a user can only enroll once in a course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Index for quick lookups
enrollmentSchema.index({ user: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });

// Method to calculate overall progress
enrollmentSchema.methods.calculateProgress = function() {
  if (!this.moduleProgress?.length) return 0;
  
  const totalLessons = this.moduleProgress.reduce(
    (total, module) => total + module.lessons.length, 
    0
  );
  
  if (totalLessons === 0) return 0;
  
  const completedLessons = this.moduleProgress.reduce(
    (total, module) => total + module.lessons.filter(l => l.completed).length,
    0
  );
  
  return Math.round((completedLessons / totalLessons) * 100);
};

// Method to update time spent
enrollmentSchema.methods.updateTimeSpent = function() {
  this.totalTimeSpent = this.moduleProgress.reduce(
    (total, module) => total + module.timeSpent,
    0
  );
};

// Pre-save middleware
enrollmentSchema.pre('save', function(next) {
  // Update progress
  this.progress = this.calculateProgress();
  
  // Update total time spent
  this.updateTimeSpent();
  
  // Update lastAccessed
  this.lastAccessed = new Date();
  
  // Check if course is completed
  if (this.progress === 100 && !this.completedAt) {
    this.completedAt = new Date();
    this.status = 'completed';
  }
  
  next();
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
