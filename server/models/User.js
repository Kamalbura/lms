import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  avatar: String,
  profileImage: String, // Added to match authController.js and authRoutes.js
  profile: {
    bio: String,
    title: String,
    company: String,
    website: String,
    location: String,
    phone: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String
    },
    skills: [String],
    interests: [String]
  },
  teachingProfile: {
    expertise: [String],
    yearsOfExperience: Number,
    biography: String,
    certificates: [{
      title: String,
      issuer: String,
      year: Number,
      url: String
    }],
    availability: {
      timezone: String,
      weeklySchedule: [{
        day: Number,
        startTime: String,
        endTime: String
      }]
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    emailNotifications: {
      courseAnnouncements: { type: Boolean, default: true },
      discussionReplies: { type: Boolean, default: true },
      assessmentGrades: { type: Boolean, default: true },
      courseMessages: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false }
    },
    pushNotifications: {
      enabled: { type: Boolean, default: true },
      deviceTokens: [String]
    },
    accessibility: {
      fontSize: { type: String, default: 'medium' },
      highContrast: { type: Boolean, default: false },
      reducedMotion: { type: Boolean, default: false }
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  analytics: {
    lastLogin: Date,
    loginHistory: [{
      timestamp: Date,
      ip: String,
      userAgent: String
    }],
    courseProgress: [{
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      progress: Number,
      lastAccessed: Date
    }],
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    assessmentStats: {
      totalAttempted: { type: Number, default: 0 },
      totalPassed: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    },
    engagementMetrics: {
      discussionPosts: { type: Number, default: 0 },
      questionsAsked: { type: Number, default: 0 },
      answersGiven: { type: Number, default: 0 },
      resourcesAccessed: { type: Number, default: 0 }
    }
  },
  accountStatus: {
    isActive: { type: Boolean, default: true },
    verificationStatus: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false }
    },
    suspensionHistory: [{
      reason: String,
      startDate: Date,
      endDate: Date,
      notes: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Alias for matchPassword to maintain compatibility with authController
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await this.matchPassword(enteredPassword);
};

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to update login history
userSchema.methods.updateLoginHistory = function(ip, userAgent) {
  this.analytics.lastLogin = new Date();
  this.analytics.loginHistory.push({
    timestamp: new Date(),
    ip,
    userAgent
  });
  
  // Keep only last 10 logins
  if (this.analytics.loginHistory.length > 10) {
    this.analytics.loginHistory = this.analytics.loginHistory.slice(-10);
  }
  
  return this.save();
};

// Method to update engagement metrics
userSchema.methods.updateEngagementMetrics = function(action) {
  const metrics = this.analytics.engagementMetrics;
  
  switch (action) {
    case 'post':
      metrics.discussionPosts++;
      break;
    case 'question':
      metrics.questionsAsked++;
      break;
    case 'answer':
      metrics.answersGiven++;
      break;
    case 'resource':
      metrics.resourcesAccessed++;
      break;
  }
  
  return this.save();
};

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'analytics.lastLogin': -1 });

const User = mongoose.model('User', userSchema);

export default User;
