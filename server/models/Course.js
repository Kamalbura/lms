import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  content: {
    text: String,
    html: String,
    video: {
      url: String,
      duration: Number,
      provider: String // youtube, vimeo, direct, etc.
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number
    }]
  },
  duration: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment'],
    required: true,
    default: 'video'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  prerequisiteLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.modules.lessons'
  }],
  objectives: [String],
  order: {
    type: Number,
    required: true
  }
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  lessons: [lessonSchema],
  duration: Number, // Calculated from lessons
  order: {
    type: Number,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  prerequisiteModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.modules'
  }]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['CSE', 'IoT', 'Embedded Systems', 'Skill Development', 'Robotics']
  },
  subcategory: String,
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coInstructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  thumbnail: String,
  previewVideo: {
    url: String,
    duration: Number
  },
  duration: {
    type: Number,
    required: [true, 'Course duration is required']
  },
  price: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  modules: [moduleSchema],
  prerequisites: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    required: {
      type: Boolean,
      default: false
    }
  }],
  learningOutcomes: [String],
  requirements: [String],
  tags: [String],
  language: {
    type: String,
    default: 'English'
  },
  featuredImage: String,
  gallery: [String],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    helpful: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  analytics: {
    totalEnrollments: {
      type: Number,
      default: 0
    },
    activeStudents: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageProgress: {
      type: Number,
      default: 0
    },
    totalCompletions: {
      type: Number,
      default: 0
    },
    averageTimeToComplete: {
      type: Number,
      default: 0
    }
  },
  certificate: {
    enabled: {
      type: Boolean,
      default: true
    },
    template: {
      type: String,
      default: 'default'
    },
    requirements: {
      minProgress: {
        type: Number,
        default: 100
      },
      minScore: {
        type: Number,
        default: 70
      }
    }
  },
  settings: {
    enrollmentType: {
      type: String,
      enum: ['open', 'invite', 'approval'],
      default: 'open'
    },
    accessPeriod: {
      type: Number, // days, 0 means unlimited
      default: 0
    },
    discussionsEnabled: {
      type: Boolean,
      default: true
    },
    downloadableResources: {
      type: Boolean,
      default: true
    },
    showLeaderboard: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update timestamps
courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set publishedAt when course is published
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Calculate total duration from modules
  this.duration = this.modules.reduce((total, module) => {
    const moduleDuration = module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    module.duration = moduleDuration;
    return total + moduleDuration;
  }, 0);
  
  next();
});

// Create slug from title
courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Method to add a review
courseSchema.methods.addReview = function(userId, rating, review) {
  this.reviews.push({
    user: userId,
    rating,
    review
  });
  
  // Update rating distribution
  this.rating.distribution[rating]++;
  
  // Recalculate average rating
  const totalRatings = Object.values(this.rating.distribution).reduce((a, b) => a + b, 0);
  const weightedSum = Object.entries(this.rating.distribution)
    .reduce((sum, [rating, count]) => sum + (rating * count), 0);
  
  this.rating.average = weightedSum / totalRatings;
  this.rating.count = totalRatings;
  
  return this.save();
};

// Method to update analytics
courseSchema.methods.updateAnalytics = function(data) {
  Object.assign(this.analytics, data);
  return this.save();
};

// Indexes
courseSchema.index({ slug: 1 }, { unique: true });
courseSchema.index({ category: 1, subcategory: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isPublished: 1, publishedAt: -1 });
courseSchema.index({ 
  title: 'text',
  description: 'text',
  tags: 'text'
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
